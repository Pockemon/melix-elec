# Foreman-EX — exécutant Claude Code (worker) déclenché par le commentaire de consigne de Foreman.
# Contrat (INVARIANTS 177) : le fournisseur produit une tête de branche ; il ne fusionne pas, n'ouvre pas de PR,
# ne déclare jamais la livraison. Foreman constate la tête de la branche imposée.
# Claude Code tourne SANS accès GitHub (config git/gh isolée) : il commite seulement ; ce script pousse
# ensuite, sans force, sur la seule branche imposée. Aucune valeur de secret n'est lue ni écrite ici.
$ErrorActionPreference = 'Continue'
$OutputEncoding = New-Object Text.UTF8Encoding $false
try { [Console]::OutputEncoding = New-Object Text.UTF8Encoding $false } catch { }
$body   = $env:COMMENT_BODY
$issue  = $env:ISSUE
$repo   = $env:REPO
$runUrl = $env:RUN_URL
$claude = Join-Path $env:USERPROFILE '.local\bin\claude.exe'
$model  = if ($env:FOREMAN_CLAUDE_MODEL) { $env:FOREMAN_CLAUDE_MODEL } else { 'claude-sonnet-5-5' }
$tmp    = $env:RUNNER_TEMP

# Tout texte publié est neutralisé : il ne peut ni mentionner quiconque (dont l'exécutant) ni porter le marqueur de consigne
# ni celui de demande de revue (sinon le commentaire relancerait ce workflow).
function Neutralize([string]$t) {
  if (-not $t) { return '' }
  $t = [regex]::Replace($t, '@(?=[A-Za-z0-9])', '[at]')
  $t = [regex]::Replace($t, '(?i)\[FOREMAN_REVIEW_RESULT\]', '[FOREMAN-REVIEW-RESULT]')
  return [regex]::Replace($t, '(?i)foreman-(launch(?:-attempt)?|review-only|runtime-proof):', 'foreman-$1 :')
}
# Seul le verdict du mode revue (PostVerdict) porte [FOREMAN_REVIEW_RESULT] : un rapport d'auteur ne peut jamais en forger un.
function Post([string]$text, [switch]$Verdict) {
  $f = Join-Path $tmp ('c-' + [guid]::NewGuid().ToString('N') + '.md')
  $out = if ($Verdict) { $text } else { Neutralize $text }
  [IO.File]::WriteAllText($f, $out, (New-Object Text.UTF8Encoding $false))
  $o = (& gh issue comment $issue -R $repo --body-file $f 2>&1) -join ' '
  Write-Host "comment exit=$LASTEXITCODE $o"
}
function Decline([string]$why) { Post "Exécutant Claude Code ($runUrl).`n`nFOREMAN-WORKER-OUTCOME: DECLINED — $why"; exit 0 }

# 0a. MODE PREUVE (Foreman-EX, mission de preuve runtime) : session Claude Code SANS accès en écriture au dépôt. Elle joue le
# scénario réel de la capacité sur la révision demandée (navigateur headless, Blender, Bambu Studio, Edge, application installée
# sur le poste, dans la session de l'utilisateur) et rend UNE ligne structurée. Aucun commit, aucun push, aucune branche : le
# dépôt est cloné sans remote, les jetons GitHub sont retirés de la session, et HEAD / .git/config / fichiers suivis sont
# vérifiés inchangés après coup. Foreman n'accepte la réponse que postérieure à sa demande, signée du propriétaire, avec
# l'en-tête « Preuve runtime (<exécution>) » et la même exécution citée dans l'objet JSON.
function ProofRefuse([string]$why) { Post "Preuve runtime non rendue ($runUrl).`n`nFOREMAN-RUNTIME-OUTCOME: REFUSED — $why"; exit 0 }
function Get-ProofObject([string]$t, [string]$cap) {
  if (-not $t) { return $null }
  $found = $null
  foreach ($mm in [regex]::Matches($t, '(?m)^FOREMAN-RUNTIME-PROOF:\s*(\{.*\})\s*$')) {
    try { $o = $mm.Groups[1].Value | ConvertFrom-Json } catch { continue }
    $v = [string]$o.verdict
    if ($o -and [string]$o.capabilityId -eq $cap -and ($v -eq 'SATISFIED' -or $v -eq 'FAIL' -or $v -eq 'HUMAN_REQUIRED')) { $found = $o }
  }
  return $found
}
function ConvertTo-ProofResultJson($cap, $rev, $verdict, $diag, $human, $url) {
  $o = [ordered]@{ capabilityId = $cap; revision = $rev; verdict = $verdict; diagnostics = $diag }
  if ($human) { $o['humanAction'] = $human }
  $o['runUrl'] = $url
  return (ConvertTo-Json -InputObject $o -Compress)
}
if ($env:FOREMAN_MODE -eq 'proof') {
  $pid_ = [regex]::Match($body, '(?mi)^foreman-runtime-proof:(\S+)\s*$').Groups[1].Value
  $cap  = [regex]::Match($body, '(?m)^Capacité :\s*(\S+)').Groups[1].Value
  $rev  = [regex]::Match($body, '(?m)^Révision livrée/servie/installée à observer :\s*([0-9a-fA-F]{7,40})\s*$').Groups[1].Value.ToLower()
  if (-not $pid_ -or -not $cap -or -not $rev) { ProofRefuse "la demande ne porte pas requestId, capacité et révision lisibles." }
  if (-not (Test-Path $claude)) { ProofRefuse "Claude Code est absent du poste ($claude)." }
  Post "Preuve runtime prise en charge (mode preuve, aucune écriture du dépôt) pour ``$cap`` sur ``$rev`` — exécution $runUrl"
  $pws = Join-Path $tmp ('pv-' + $issue + '-' + $env:GITHUB_RUN_ID)
  $cl = (& gh repo clone $repo $pws -- --no-tags 2>&1) -join ' '
  if (-not (Test-Path (Join-Path $pws '.git'))) { ProofRefuse "clone de $repo impossible : $cl" }
  Set-Location $pws
  & git fetch --no-tags origin $rev 2>&1 | Out-Null
  & git -c core.hooksPath=NUL checkout --detach -q $rev 2>&1 | Out-Null
  $at = (& git rev-parse HEAD).Trim()
  if (-not $at.StartsWith($rev)) { ProofRefuse "la révision $rev n'a pas pu être extraite (HEAD $at)." }
  & git remote remove origin 2>&1 | Out-Null
  $pcfgHash = (Get-FileHash (Join-Path $pws '.git\config')).Hash

  $pprompt = @"
Tu es l'exécutant de PREUVE RUNTIME de Foreman-EX pour le dépôt $repo (issue #$issue). Mode preuve : tu observes, tu ne modifies rien.
La révision $at est extraite (HEAD détaché, sans remote). Lis AGENTS.md / CLAUDE.md pour savoir comment lancer le produit.
Règles non négociables :
- Aucune modification du code du dépôt, aucun commit, aucun push, aucune branche, aucune PR, aucune issue : tu n'as aucun accès GitHub. Tes fichiers temporaires vont hors du dépôt.
- Tu joues le scénario réel de la capacité sur cette révision, avec les outils du poste (navigateur headless Playwright, Blender, Bambu Studio, Edge, application installée), dans la session de l'utilisateur.
- Aucune donnée personnelle, aucune valeur de secret dans ta réponse. N'agis sur aucun autre dépôt, issue, personne ou service.
- Tu ne cites aucune exécution que tu n'as pas faite. Si le scénario exige un humain (compte, écran, appareil, paiement), réponds HUMAN_REQUIRED avec l'action exacte (compte, écran, action, effet attendu).
- Termine par UNE ligne, seule sur sa ligne : FOREMAN-RUNTIME-PROOF: {"capabilityId":"$cap","revision":"$rev","verdict":"SATISFIED|FAIL|HUMAN_REQUIRED","diagnostics":"constat observé","humanAction":"seulement pour HUMAN_REQUIRED"}

DEMANDE DE PREUVE DE FOREMAN (texte intégral du commentaire) :
"@
  $pfile = Join-Path $tmp ('pp-' + $env:GITHUB_RUN_ID + '.txt')
  [IO.File]::WriteAllText($pfile, ($pprompt + "`n" + $body), (New-Object Text.UTF8Encoding $false))
  $pout = Join-Path $tmp ('pr-' + $env:GITHUB_RUN_ID + '.json')
  $piso = Join-Path $tmp ('piso-' + $env:GITHUB_RUN_ID); New-Item -ItemType Directory -Force $piso | Out-Null
  New-Item -ItemType File -Force (Join-Path $piso 'gitconfig') | Out-Null
  $psaved = @{ GIT_CONFIG_GLOBAL = $env:GIT_CONFIG_GLOBAL; GIT_CONFIG_NOSYSTEM = $env:GIT_CONFIG_NOSYSTEM; GH_CONFIG_DIR = $env:GH_CONFIG_DIR; GIT_TERMINAL_PROMPT = $env:GIT_TERMINAL_PROMPT; GH_TOKEN = $env:GH_TOKEN; GITHUB_TOKEN = $env:GITHUB_TOKEN }
  $env:GIT_CONFIG_GLOBAL = Join-Path $piso 'gitconfig'; $env:GIT_CONFIG_NOSYSTEM = '1'; $env:GH_CONFIG_DIR = $piso; $env:GIT_TERMINAL_PROMPT = '0'
  Remove-Item Env:GH_TOKEN, Env:GITHUB_TOKEN -ErrorAction SilentlyContinue
  # Ni réglages, ni hooks, ni serveurs MCP fournis par la révision observée : seuls ceux du poste. Pas d'Edit : le dépôt est observé, pas écrit.
  $pargs = @('-p', '--model', $model, '--output-format', 'json', '--permission-mode', 'acceptEdits',
    '--setting-sources', 'user', '--strict-mcp-config', '--disable-slash-commands',
    '--allowedTools', 'Bash,Read,Write,Glob,Grep,TodoWrite',
    '--disallowedTools', 'Edit,NotebookEdit,WebFetch,WebSearch,Bash(gh:*),Bash(git push:*),Bash(git commit:*),Bash(git add:*),Bash(git checkout:*),Bash(git reset:*),Bash(git clean:*),Bash(git stash:*),Bash(git config:*),Bash(git remote:*),Bash(curl:*),Bash(Invoke-WebRequest:*),Bash(Invoke-RestMethod:*)')
  Get-Content -Raw -Encoding UTF8 $pfile | & $claude @pargs 2> ($pout + '.err') | Out-File -Encoding utf8 $pout
  $pexit = $LASTEXITCODE
  foreach ($k in @($psaved.Keys)) { if ($null -ne $psaved[$k]) { Set-Item "Env:$k" $psaved[$k] } else { Remove-Item "Env:$k" -ErrorAction SilentlyContinue } }

  $pr = $null
  if (Test-Path $pout) { try { $pr = Get-Content -Raw -Encoding UTF8 $pout | ConvertFrom-Json } catch { } }
  $ptext = if ($pr -and $pr.result) { [string]$pr.result } else { ((Get-Content -Raw -Encoding UTF8 $pout -ErrorAction SilentlyContinue) + ' ' + (Get-Content -Raw -Encoding UTF8 ($pout + '.err') -ErrorAction SilentlyContinue)).Trim() }
  $perr = "$ptext $(if ($pr) { $pr.subtype }) $(if ($pr) { $pr.api_error_status })"
  if (($pexit -ne 0 -or ($pr -and $pr.is_error)) -and ($perr -match '(?i)credit balance|insufficient[_ ]quota|rate[_ ]limit|usage limit|overloaded|\b(401|402|429|529)\b|unauthori[sz]ed|token has expired|run /login|login expired|not logged in')) {
    ProofRefuse "capacité Claude indisponible."
  }
  # Aucune écriture : ni HEAD, ni configuration, ni fichier suivi n'ont bougé.
  $pdirty = (& git status --porcelain --untracked-files=no) -join ''
  if ((& git rev-parse HEAD).Trim() -ne $at -or (Get-FileHash (Join-Path $pws '.git\config')).Hash -ne $pcfgHash -or $pdirty) { ProofRefuse "la session de preuve a modifié le dépôt : verdict écarté." }

  $po = Get-ProofObject $ptext $cap
  if (-not $po) { ProofRefuse "la session n'a pas rendu de ligne FOREMAN-RUNTIME-PROOF lisible pour $cap (code $pexit)." }
  $prev = ([string]$po.revision).Trim().ToLower()
  if ($prev.Length -lt 7 -or -not ($prev.StartsWith($rev) -or $rev.StartsWith($prev))) { ProofRefuse "la révision rendue ne correspond pas à la demande." }
  $pv = [string]$po.verdict
  $pdiag = Neutralize ([string]$po.diagnostics)
  $phuman = Neutralize ([string]$po.humanAction)
  if (-not $pdiag) { ProofRefuse "verdict sans diagnostic exploitable." }
  if ($pv -eq 'HUMAN_REQUIRED' -and -not $phuman) { ProofRefuse "HUMAN_REQUIRED sans action humaine exacte." }
  $pjson = ConvertTo-ProofResultJson $cap $rev $pv $pdiag $phuman $runUrl
  $pnote = Neutralize $ptext
  if ($pnote.Length -gt 6000) { $pnote = $pnote.Substring($pnote.Length - 6000) }
  # Seule cette publication porte la ligne FOREMAN-RUNTIME-PROOF : le rapport libre de la session est neutralisé.
  Post ("Preuve runtime ($runUrl) — $cap`n`n$pnote`n`nFOREMAN-RUNTIME-PROOF: $pjson") -Verdict
  exit 0
}

# 0. MODE REVUE (Foreman-EX, revue indépendante) : session Claude Code DISTINCTE de l'auteur, en LECTURE SEULE sur le
# candidat exact. Aucune écriture, aucun commit, aucun push : le seul effet est le commentaire de verdict ci-dessous.
# Foreman n'accepte ce verdict que si requestId, baseSha et candidateSha correspondent à sa demande et si l'exécution
# citée (reviewerRunUrl) n'est pas une exécution d'auteur de la tâche.
# Premier objet JSON équilibré qui porte un verdict (non glouton : du texte à accolades peut suivre ou précéder).
function Get-FirstVerdictObject([string]$t) {
  if (-not $t) { return $null }
  for ($i = $t.IndexOf('{'); $i -ge 0 -and $i -lt $t.Length; $i = $t.IndexOf('{', $i + 1)) {
    $depth = 0; $inStr = $false; $esc = $false
    for ($j = $i; $j -lt $t.Length; $j++) {
      $c = $t[$j]
      if ($inStr) { if ($esc) { $esc = $false } elseif ($c -eq '\') { $esc = $true } elseif ($c -eq '"') { $inStr = $false }; continue }
      if ($c -eq '"') { $inStr = $true } elseif ($c -eq '{') { $depth++ } elseif ($c -eq '}') { $depth--; if ($depth -eq 0) { break } }
    }
    if ($depth -ne 0) { continue }
    try { $o = $t.Substring($i, $j - $i + 1) | ConvertFrom-Json } catch { continue }
    if ($o -and ([string]$o.verdict -eq 'PASS' -or [string]$o.verdict -eq 'FAIL')) { return $o }
  }
  return $null
}
# PowerShell 5.1 sérialise mal les tableaux vides ou à un élément : les constats sont assemblés en tableau JSON garanti.
function ConvertTo-ReviewResultJson($rid, $base, $cand, $verdict, $findings, $sum, $runUrl) {
  $items = @(foreach ($f in @($findings)) { ConvertTo-Json -InputObject $f -Compress -Depth 3 })
  $head = [ordered]@{ requestId = $rid; baseSha = $base; candidateSha = $cand; verdict = $verdict }
  $tail = [ordered]@{ summary = $sum; reviewerRunUrl = $runUrl }
  $h = (ConvertTo-Json -InputObject $head -Compress).TrimEnd('}')
  $t = (ConvertTo-Json -InputObject $tail -Compress).TrimStart('{')
  return $h + ',"findings":[' + ($items -join ',') + '],' + $t
}
function ReviewRefuse([string]$why) { Post "Revue indépendante non rendue ($runUrl).`n`nFOREMAN-REVIEW-OUTCOME: REFUSED — $why"; exit 0 }
function ReviewUnavailable([string]$why) { Post "Revue indépendante non rendue ($runUrl).`n`nFOREMAN-REVIEW-OUTCOME: PROVIDER_UNAVAILABLE — $why Foreman persiste l'attente ; aucun repli payant."; exit 0 }
if ($env:FOREMAN_MODE -eq 'review') {
  $rid  = [regex]::Match($body, '(?m)^requestId:\s*(\S+)\s*$').Groups[1].Value
  $base = [regex]::Match($body, '(?m)^baseSha:\s*([0-9a-fA-F]{40})\s*$').Groups[1].Value.ToLower()
  $cand = [regex]::Match($body, '(?m)^candidateSha:\s*([0-9a-fA-F]{40})\s*$').Groups[1].Value.ToLower()
  $pr   = [regex]::Match($body, '(?m)^PR:\s*#(\d+)\s*$').Groups[1].Value
  if (-not $rid -or -not $base -or -not $cand) { ReviewRefuse "la demande ne porte pas requestId, baseSha et candidateSha lisibles." }
  if (-not (Test-Path $claude)) { ReviewUnavailable "Claude Code est absent du poste ($claude)." }
  Post "Revue indépendante prise en charge (session distincte de l'auteur, lecture seule) sur ``$cand`` — exécution $runUrl"
  $rws = Join-Path $tmp ('rv-' + $issue + '-' + $env:GITHUB_RUN_ID)
  $cl = (& gh repo clone $repo $rws -- --no-tags 2>&1) -join ' '
  if (-not (Test-Path (Join-Path $rws '.git'))) { ReviewRefuse "clone de $repo impossible : $cl" }
  Set-Location $rws
  if ($pr) { & git fetch --no-tags origin "refs/pull/$pr/head" 2>&1 | Out-Null }
  & git fetch --no-tags origin $cand 2>&1 | Out-Null
  & git fetch --no-tags origin $base 2>&1 | Out-Null
  & git -c core.hooksPath=NUL checkout --detach -q $cand 2>&1 | Out-Null
  $at = (& git rev-parse HEAD).Trim()
  if ($at -ne $cand) { ReviewRefuse "le candidat $cand n'a pas pu être extrait (HEAD $at)." }
  & git cat-file -e "$base^{commit}" 2>$null
  if ($LASTEXITCODE -ne 0) { ReviewRefuse "la base $base est introuvable dans le clone." }
  $rcfgHash = (Get-FileHash (Join-Path $rws '.git\config')).Hash

  $rprompt = @"
Tu es le RELECTEUR INDÉPENDANT de Foreman-EX pour le dépôt $repo (issue #$issue). Tu n'es pas l'auteur du changement : tu travailles dans une session neuve, en LECTURE SEULE.
Le candidat exact $cand est extrait (HEAD détaché). La base est $base.
Règles non négociables :
- Lis uniquement le diff : git diff $base $cand (et git log / git show), puis les fichiers du dépôt que ce diff touche ou dont il dépend directement. Lis AGENTS.md / CLAUDE.md pour les conventions.
- N'écris rien : aucun fichier, aucun commit, aucun push, aucun appel réseau, aucun autre dépôt, aucune issue ni pull request.
- Ne rends PASS que si tu as lu tout le diff. Juge la correction, l'architecture existante, les tests et la cohérence avec la demande ci-dessous.
- Réponds par UN SEUL objet JSON, sans texte autour : {"verdict":"PASS|FAIL","findings":[{"file":"chemin","line":12,"reason":"..."}],"summary":"une à trois phrases"}.
  Un FAIL porte au moins un constat ; un PASS peut porter des constats non bloquants. Aucune valeur de secret dans ta réponse.

DEMANDE DE REVUE DE FOREMAN (texte intégral du commentaire) :
"@
  $rpromptFile = Join-Path $tmp ('rp-' + $env:GITHUB_RUN_ID + '.txt')
  [IO.File]::WriteAllText($rpromptFile, ($rprompt + "`n" + $body), (New-Object Text.UTF8Encoding $false))
  $routFile = Join-Path $tmp ('rr-' + $env:GITHUB_RUN_ID + '.json')
  $riso = Join-Path $tmp ('riso-' + $env:GITHUB_RUN_ID); New-Item -ItemType Directory -Force $riso | Out-Null
  New-Item -ItemType File -Force (Join-Path $riso 'gitconfig') | Out-Null
  $rsaved = @{ GIT_CONFIG_GLOBAL = $env:GIT_CONFIG_GLOBAL; GIT_CONFIG_NOSYSTEM = $env:GIT_CONFIG_NOSYSTEM; GH_CONFIG_DIR = $env:GH_CONFIG_DIR; GIT_TERMINAL_PROMPT = $env:GIT_TERMINAL_PROMPT; GH_TOKEN = $env:GH_TOKEN; GITHUB_TOKEN = $env:GITHUB_TOKEN }
  $env:GIT_CONFIG_GLOBAL = Join-Path $riso 'gitconfig'; $env:GIT_CONFIG_NOSYSTEM = '1'; $env:GH_CONFIG_DIR = $riso; $env:GIT_TERMINAL_PROMPT = '0'
  Remove-Item Env:GH_TOKEN, Env:GITHUB_TOKEN -ErrorAction SilentlyContinue
  # Lecture seule : seuls Read, Glob, Grep et git diff/log/show sont autorisés ; tout le reste est refusé.
  $rargs = @('-p', '--model', $model, '--output-format', 'json',
    # Ni réglages, ni hooks, ni serveurs MCP fournis par le candidat (.claude/settings*.json, .mcp.json) : seuls ceux du poste.
    '--setting-sources', 'user', '--strict-mcp-config', '--disable-slash-commands',
    '--allowedTools', 'Read,Glob,Grep,Bash(git diff:*),Bash(git log:*),Bash(git show:*)',
    '--disallowedTools', 'Edit,Write,NotebookEdit,WebFetch,WebSearch,Bash(gh:*),Bash(git push:*),Bash(git commit:*),Bash(git checkout:*),Bash(git reset:*),Bash(git config:*),Bash(git remote:*),Bash(curl:*),Bash(Invoke-WebRequest:*),Bash(Invoke-RestMethod:*)')
  Get-Content -Raw -Encoding UTF8 $rpromptFile | & $claude @rargs 2> ($routFile + '.err') | Out-File -Encoding utf8 $routFile
  $rexit = $LASTEXITCODE
  foreach ($k in @($rsaved.Keys)) { if ($null -ne $rsaved[$k]) { Set-Item "Env:$k" $rsaved[$k] } else { Remove-Item "Env:$k" -ErrorAction SilentlyContinue } }

  $rr = $null
  if (Test-Path $routFile) { try { $rr = Get-Content -Raw -Encoding UTF8 $routFile | ConvertFrom-Json } catch { } }
  $rtext = if ($rr -and $rr.result) { [string]$rr.result } else { ((Get-Content -Raw -Encoding UTF8 $routFile -ErrorAction SilentlyContinue) + ' ' + (Get-Content -Raw -Encoding UTF8 ($routFile + '.err') -ErrorAction SilentlyContinue)).Trim() }
  $rerr = "$rtext $(if ($rr) { $rr.subtype }) $(if ($rr) { $rr.api_error_status })"
  if (($rexit -ne 0 -or ($rr -and $rr.is_error)) -and ($rerr -match '(?i)credit balance|insufficient[_ ]quota|rate[_ ]limit|usage limit|overloaded|\b(401|402|429|529)\b|unauthori[sz]ed|token has expired|run /login|login expired|not logged in')) {
    ReviewUnavailable "capacité Claude indisponible."
  }
  # Lecture seule vérifiée : ni HEAD, ni configuration, ni arbre de travail n'ont bougé.
  $dirty = (& git status --porcelain) -join ''
  if ((& git rev-parse HEAD).Trim() -ne $cand -or (Get-FileHash (Join-Path $rws '.git\config')).Hash -ne $rcfgHash -or $dirty) { ReviewRefuse "la session de revue a modifié le dépôt : verdict écarté." }

  # Premier objet JSON de la réponse (la session peut l'entourer d'un bloc de code).
  $obj = $null
  $obj = Get-FirstVerdictObject $rtext
  $verdict = if ($obj) { [string]$obj.verdict } else { '' }
  if ($verdict -ne 'PASS' -and $verdict -ne 'FAIL') { ReviewRefuse "la session de revue n'a pas rendu de verdict PASS ou FAIL lisible (code $rexit)." }
  $fl = @()
  foreach ($f in @($obj.findings)) {
    if (-not $f -or -not $f.file -or -not $f.reason) { continue }
    $one = [ordered]@{ file = (Neutralize ([string]$f.file)); reason = (Neutralize ([string]$f.reason)) }
    $ln = 0
    if ([int]::TryParse([string]$f.line, [ref]$ln) -and $ln -gt 0) { $one['line'] = $ln }
    $fl += ,$one
  }
  if ($verdict -eq 'FAIL' -and $fl.Count -eq 0) { ReviewRefuse "FAIL sans constat exploitable." }
  $sum = if ($obj.summary) { Neutralize ([string]$obj.summary) } else { 'Revue indépendante rendue.' }
  if ($sum.Length -gt 2000) { $sum = $sum.Substring(0, 2000) }
  Post ("[FOREMAN_REVIEW_RESULT] " + (ConvertTo-ReviewResultJson $rid $base $cand $verdict $fl $sum $runUrl)) -Verdict
  exit 0
}

# 1. Branche imposée et marqueur de la consigne
$m = [regex]::Match($body, 'Branche impos[ée]e\s*:\s*`?(\w[\w./-]*)')
if (-not $m.Success) { Decline "la consigne ne nomme pas de branche imposée lisible." }
$branch = $m.Groups[1].Value.TrimEnd('.')
$launch = [regex]::Match($body, '(?i)foreman-launch:[0-9a-z-]+').Value
if ($branch -in @('main', 'master')) { Decline "la branche imposée ``$branch`` est une branche par défaut : refus." }
if (-not (Test-Path $claude)) { Decline "Claude Code est absent du poste ($claude)." }

# 2. Accusé de prise en charge
Post "Prise en charge par l'exécutant Claude Code sur ``$branch`` — exécution $runUrl"

# 3. Clone propre de la branche imposée (identité GitHub du poste, réservée à ce script)
$ws = Join-Path $tmp ('ws-' + $issue + '-' + $env:GITHUB_RUN_ID)
$cl = (& gh repo clone $repo $ws -- --branch $branch --no-tags 2>&1) -join ' '
if (-not (Test-Path (Join-Path $ws '.git'))) { Decline "clone de $repo sur ``$branch`` impossible : $cl" }
Set-Location $ws
& git config user.name 'Claude Code (Foreman-EX)'
& git config user.email 'claude-code-foreman@users.noreply.github.com'
$before = (& git rev-parse HEAD).Trim()
$pushUrl = "https://github.com/$repo.git"

# 4. Consigne transmise à Claude Code
$preamble = @"
Tu es l'exécutant d'implémentation de Foreman-EX pour le dépôt $repo (issue #$issue).
Tu travailles dans ce clone, sur la branche imposée ``$branch``, déjà extraite. Lis d'abord AGENTS.md / CLAUDE.md et les documents d'architecture du dépôt s'ils existent ; respecte l'architecture existante et le périmètre de la consigne.
Règles non négociables :
- Tu n'as pas d'accès GitHub : ne tente ni push, ni PR, ni fusion, ni appel d'API GitHub. Commite localement ; la publication sur ``$branch`` est faite après toi, sans force.
- Chaque message de commit contient la ligne « Refs #$issue » et la ligne « $launch ».
- Exécute les tests pertinents disponibles sur ce poste et rapporte leur sortie brute.
- N'agis sur aucun autre dépôt, issue, personne ou service. Aucune valeur de secret dans le code, les commits ou le rapport.
- Si tu t'arrêtes sans commit, termine par une ligne commençant exactement par « FOREMAN-WORKER-OUTCOME: DECLINED — » suivie de la raison. Si tu contestes un constat de revue, par « FOREMAN-WORKER-OUTCOME: CONTEST » suivi d'un objet JSON {"findings":[...],"reason":"..."}.
Termine par un rapport court : ce qui a été fait, fichiers modifiés, tests et résultats, commits.

CONSIGNE DE FOREMAN (texte intégral du commentaire) :
"@
$promptFile = Join-Path $tmp ('p-' + $env:GITHUB_RUN_ID + '.txt')
[IO.File]::WriteAllText($promptFile, ($preamble + "`n" + $body), (New-Object Text.UTF8Encoding $false))
$outFile = Join-Path $tmp ('r-' + $env:GITHUB_RUN_ID + '.json')

# Isolement : ni configuration git globale/système (aide d'identification), ni configuration gh.
$iso = Join-Path $tmp ('iso-' + $env:GITHUB_RUN_ID); New-Item -ItemType Directory -Force $iso | Out-Null
New-Item -ItemType File -Force (Join-Path $iso 'gitconfig') | Out-Null
# L'isolement masque core.autocrlf du poste : on le lit avant et on le reporte dans la config locale du clone, sinon les fichiers sont recommités en CRLF.
$autocrlf = (& git config --get core.autocrlf 2>$null)
if ($autocrlf) { & git config --local core.autocrlf $autocrlf }
# Empreinte prise APRÈS nos propres écritures de configuration : seule une modification par l'exécutant la fera différer.
$cfgHash = (Get-FileHash (Join-Path $ws '.git\config')).Hash
$saved = @{ GIT_CONFIG_GLOBAL = $env:GIT_CONFIG_GLOBAL; GIT_CONFIG_NOSYSTEM = $env:GIT_CONFIG_NOSYSTEM; GH_CONFIG_DIR = $env:GH_CONFIG_DIR; GIT_TERMINAL_PROMPT = $env:GIT_TERMINAL_PROMPT; GH_TOKEN = $env:GH_TOKEN; GITHUB_TOKEN = $env:GITHUB_TOKEN }
$env:GIT_CONFIG_GLOBAL = Join-Path $iso 'gitconfig'; $env:GIT_CONFIG_NOSYSTEM = '1'; $env:GH_CONFIG_DIR = $iso; $env:GIT_TERMINAL_PROMPT = '0'
Remove-Item Env:GH_TOKEN, Env:GITHUB_TOKEN -ErrorAction SilentlyContinue

$cargs = @('-p', '--model', $model, '--output-format', 'json', '--permission-mode', 'acceptEdits',
  '--allowedTools', 'Bash,Read,Edit,Write,Glob,Grep,TodoWrite',
  '--disallowedTools', 'WebFetch,WebSearch,Bash(gh:*),Bash(git push:*),Bash(git remote:*),Bash(git config:*),Bash(curl:*),Bash(Invoke-WebRequest:*),Bash(Invoke-RestMethod:*)')
Get-Content -Raw -Encoding UTF8 $promptFile | & $claude @cargs 2> ($outFile + '.err') | Out-File -Encoding utf8 $outFile
$exit = $LASTEXITCODE

foreach ($k in @($saved.Keys)) { if ($null -ne $saved[$k]) { Set-Item "Env:$k" $saved[$k] } else { Remove-Item "Env:$k" -ErrorAction SilentlyContinue } }

# 5. Résultat de Claude Code
$r = $null
if (Test-Path $outFile) { try { $r = Get-Content -Raw -Encoding UTF8 $outFile | ConvertFrom-Json } catch { } }
$text = if ($r -and $r.result) { [string]$r.result } else { ((Get-Content -Raw -Encoding UTF8 $outFile -ErrorAction SilentlyContinue) + ' ' + (Get-Content -Raw -Encoding UTF8 ($outFile + '.err') -ErrorAction SilentlyContinue)).Trim() }
if ($text.Length -gt 40000) { $text = $text.Substring($text.Length - 40000) }
$cost = if ($r -and $r.total_cost_usd) { '{0:N2} $' -f [double]$r.total_cost_usd } else { 'inconnu' }

# 6. Publication par ce script, sans force, sur la seule branche imposée.
# Hooks neutralisés et URL explicite : rien de ce que l'exécutant a écrit dans .git ne s'exécute avec l'identité du poste.
if ((Get-FileHash (Join-Path $ws '.git\config')).Hash -ne $cfgHash) { Decline "l'exécutant a modifié .git/config : publication refusée par sécurité." }
$head = (& git rev-parse HEAD).Trim()
if ($head -ne $before -and $launch) {
  $msgs = (& git log --format=%B "$before..$head") -join "`n"
  if ($msgs -notmatch [regex]::Escape($launch)) { & git -c core.hooksPath=NUL commit --no-verify --allow-empty -q -m "foreman: rattachement de la consigne" -m "Refs #$issue" -m $launch 2>&1 | Out-Null; $head = (& git rev-parse HEAD).Trim() }
}
$pushNote = ''
if ($head -ne $before) {
  $po = (& git -c core.hooksPath=NUL push --no-verify $pushUrl "HEAD:refs/heads/$branch" 2>&1) -join ' '
  if ($LASTEXITCODE -ne 0) { $pushNote = "Publication refusée : $po" }
}
$after = ((& git -c core.hooksPath=NUL ls-remote $pushUrl "refs/heads/$branch" 2>$null) -join '' -split '\s+')[0]
$advanced = ($after -and $head -ne $before -and $after -eq $head)

$hasOutcome = $text -match '(?m)^FOREMAN-WORKER-OUTCOME:'
$errText = "$text $(if ($r) { $r.subtype }) $(if ($r) { $r.api_error_status })"
$unavailable = ($exit -ne 0 -or ($r -and $r.is_error)) -and ($errText -match '(?i)credit balance|insufficient[_ ]quota|rate[_ ]limit|usage limit|overloaded|\b(401|402|429|529)\b|unauthori[sz]ed|token has expired|run /login|login expired|not logged in')

$head1 = "Rapport de l'exécutant Claude Code ($runUrl, coût $cost, code $exit)."
$state = if ($advanced) { "Tête de ``$branch`` : $before → $after." } elseif ($head -ne $before) { "Commits locaux NON publiés sur ``$branch`` (tête distante : $after). $pushNote" } else { "Aucun commit publié sur ``$branch``." }
if ($advanced) {
  Post "$head1`n$state`n`n$text"
} elseif ($unavailable) {
  Post "$head1`n$state`n`nFOREMAN-WORKER-OUTCOME: PROVIDER_UNAVAILABLE — capacité Claude indisponible. Foreman persiste l'attente ; aucun repli payant."
} elseif ($hasOutcome) {
  Post "$head1`n$state`n`n$text"
} else {
  Post "$head1`n$state`n`n$text`n`nFOREMAN-WORKER-OUTCOME: DECLINED — l'exécutant s'est arrêté sans commit publié (code $exit$(if ($pushNote) { ', ' + $pushNote }))."
}
exit 0
