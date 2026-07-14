param(
    [int]$Port = 5500
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = [System.Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
$listener.Start()

Write-Host "Dev server running at http://localhost:$Port/"

$mimeTypes = @{
    ".css"  = "text/css; charset=utf-8"
    ".gif"  = "image/gif"
    ".html" = "text/html; charset=utf-8"
    ".ico"  = "image/x-icon"
    ".jpeg" = "image/jpeg"
    ".jpg"  = "image/jpeg"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".svg"  = "image/svg+xml"
    ".txt"  = "text/plain; charset=utf-8"
    ".webp" = "image/webp"
}

function Get-VersionStamp {
    $files = Get-ChildItem -Path $root -Recurse -File | Where-Object {
        $_.Extension -in @(".html", ".css", ".js", ".jpg", ".jpeg", ".png", ".svg", ".webp", ".gif")
    }

    if (-not $files) {
        return "0"
    }

    $latest = ($files | Measure-Object -Property LastWriteTimeUtc -Maximum).Maximum
    return [DateTime]::SpecifyKind($latest, [DateTimeKind]::Utc).Ticks.ToString()
}

function Get-LocalPath([string]$relativePath) {
    $trimmed = $relativePath.TrimStart("/")
    if ([string]::IsNullOrWhiteSpace($trimmed)) {
        $trimmed = "index.html"
    }

    $clean = [Uri]::UnescapeDataString($trimmed).Replace("/", [IO.Path]::DirectorySeparatorChar)
    $candidate = Join-Path $root $clean

    if (Test-Path -LiteralPath $candidate -PathType Container) {
        $candidate = Join-Path $candidate "index.html"
    }

    return $candidate
}

$reloadSnippet = @'
<script>
(() => {
  let version = null;
  const poll = async () => {
    try {
      const response = await fetch('/__codex_version', { cache: 'no-store' });
      const nextVersion = await response.text();
      if (version && version !== nextVersion) {
        location.reload();
        return;
      }
      version = nextVersion;
    } catch (error) {
      console.debug('Reload check failed', error);
    }
    setTimeout(poll, 1000);
  };
  poll();
})();
</script>
'@

function Send-Response($stream, [int]$statusCode, [string]$statusText, [string]$contentType, [byte[]]$body) {
    $header = "HTTP/1.1 $statusCode $statusText`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
    $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    $stream.Write($body, 0, $body.Length)
}

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $stream = $client.GetStream()
            $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
            $requestLine = $reader.ReadLine()

            while ($true) {
                $headerLine = $reader.ReadLine()
                if ([string]::IsNullOrEmpty($headerLine)) {
                    break
                }
            }

            if ([string]::IsNullOrWhiteSpace($requestLine)) {
                continue
            }

            $parts = $requestLine.Split(" ")
            $path = if ($parts.Length -ge 2) { $parts[1].Split("?")[0] } else { "/" }

            if ($path -eq "/__codex_version") {
                $body = [Text.Encoding]::UTF8.GetBytes((Get-VersionStamp))
                Send-Response $stream 200 "OK" "text/plain; charset=utf-8" $body
                continue
            }

            $filePath = Get-LocalPath $path

            if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
                $body = [Text.Encoding]::UTF8.GetBytes("Not found")
                Send-Response $stream 404 "Not Found" "text/plain; charset=utf-8" $body
                continue
            }

            $extension = [IO.Path]::GetExtension($filePath).ToLowerInvariant()
            $contentType = $mimeTypes[$extension]
            if (-not $contentType) {
                $contentType = "application/octet-stream"
            }

            if ($extension -eq ".html") {
                $content = Get-Content -LiteralPath $filePath -Raw -Encoding UTF8
                if ($content -match "</body>") {
                    $content = $content -replace "</body>", "$reloadSnippet`n</body>"
                } else {
                    $content = "$content`n$reloadSnippet"
                }
                $body = [Text.Encoding]::UTF8.GetBytes($content)
                Send-Response $stream 200 "OK" $contentType $body
                continue
            }

            $body = [IO.File]::ReadAllBytes($filePath)
            Send-Response $stream 200 "OK" $contentType $body
        } catch {
            if ($stream) {
                $body = [Text.Encoding]::UTF8.GetBytes($_.Exception.Message)
                Send-Response $stream 500 "Internal Server Error" "text/plain; charset=utf-8" $body
            }
        } finally {
            if ($reader) { $reader.Dispose() }
            if ($stream) { $stream.Dispose() }
            $client.Dispose()
        }
    }
} finally {
    $listener.Stop()
}
