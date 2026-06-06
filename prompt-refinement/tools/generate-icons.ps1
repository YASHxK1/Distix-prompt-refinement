Add-Type -AssemblyName System.Drawing

$sizes = @(16, 32, 48, 128)
$outputDirectory = Join-Path $PSScriptRoot "..\icons"
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

foreach ($size in $sizes) {
  $bitmap = New-Object System.Drawing.Bitmap($size, $size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $background = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(37, 99, 235))
  $graphics.FillEllipse($background, 0, 0, $size - 1, $size - 1)

  $penWidth = [Math]::Max(1.5, $size * 0.085)
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $penWidth)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

  $graphics.DrawLine($pen, $size * 0.29, $size * 0.69, $size * 0.69, $size * 0.29)
  $graphics.DrawLine($pen, $size * 0.31, $size * 0.31, $size * 0.69, $size * 0.69)
  $graphics.DrawLine($pen, $size * 0.50, $size * 0.18, $size * 0.50, $size * 0.32)
  $graphics.DrawLine($pen, $size * 0.50, $size * 0.68, $size * 0.50, $size * 0.82)

  $path = Join-Path $outputDirectory "icon-$size.png"
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

  $pen.Dispose()
  $background.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}
