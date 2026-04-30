$hostIp = $null
$currentAdapter = ''

foreach ($line in (ipconfig)) {
  if ($line -match 'adapter (.+):$') {
    $currentAdapter = $Matches[1]
    continue
  }

  if ($currentAdapter -match 'Wi-Fi|Wireless' -and $line -match 'IPv4 Address[^\:]*:\s*([0-9\.]+)') {
    $candidateIp = $Matches[1]
    if ($candidateIp -and $candidateIp -ne '127.0.0.1') {
      $hostIp = $candidateIp
      break
    }
  }
}

if (-not $hostIp) {
  Write-Error 'Could not detect an active LAN IPv4 address. Check your Wi-Fi connection and try again.'
  exit 1
}
$port = if ($args.Count -gt 0 -and $args[0]) { $args[0] } else { '8081' }

$env:EXPO_PACKAGER_PROXY_URL = "http://$hostIp`:$port"
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $hostIp

Write-Host "Using Expo LAN host: $hostIp`:$port"
Write-Host 'Starting Expo with forced LAN URL...'

npx expo start --lan --port $port -c
