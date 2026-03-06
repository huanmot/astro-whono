Add-Type -AssemblyName System.Drawing

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $diameter = $Radius * 2
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-PointF {
  param(
    [float]$X,
    [float]$Y
  )

  return [System.Drawing.PointF]::new($X, $Y)
}

function New-HtmlColor {
  param([string]$Value)
  return [System.Drawing.ColorTranslator]::FromHtml($Value)
}

function Draw-GradientBerry {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$CenterX,
    [float]$CenterY,
    [float]$Radius,
    [string]$StartColor,
    [string]$MidColor,
    [string]$EndColor,
    [float]$HighlightX,
    [float]$HighlightY,
    [float]$HighlightWidth,
    [float]$HighlightHeight,
    [int]$HighlightAlpha
  )

  $shadowBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(30, 125, 29, 18))
  $Graphics.FillEllipse($shadowBrush, $CenterX - $Radius + 0.9, $CenterY - $Radius + 1.7, $Radius * 2, $Radius * 2)
  $shadowBrush.Dispose()

  $rect = [System.Drawing.RectangleF]::new($CenterX - $Radius, $CenterY - $Radius, $Radius * 2, $Radius * 2)
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddEllipse($rect.X, $rect.Y, $rect.Width, $rect.Height)

  $brush = [System.Drawing.Drawing2D.LinearGradientBrush]::new($rect, [System.Drawing.Color]::Black, [System.Drawing.Color]::Black, 45.0)
  $blend = [System.Drawing.Drawing2D.ColorBlend]::new(3)
  $blend.Colors = [System.Drawing.Color[]]@(
    (New-HtmlColor $StartColor),
    (New-HtmlColor $MidColor),
    (New-HtmlColor $EndColor)
  )
  $blend.Positions = [single[]]@(0.0, 0.48, 1.0)
  $brush.InterpolationColors = $blend
  $Graphics.FillPath($brush, $path)

  $outlinePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(88, 165, 52, 30), 0.6)
  $Graphics.DrawPath($outlinePen, $path)

  $highlightBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb($HighlightAlpha, 255, 247, 241))
  $Graphics.FillEllipse($highlightBrush, $HighlightX, $HighlightY, $HighlightWidth, $HighlightHeight)

  $highlightBrush.Dispose()
  $outlinePen.Dispose()
  $brush.Dispose()
  $path.Dispose()
}

function Draw-Sparkle {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$CenterX,
    [float]$CenterY,
    [float]$Outer,
    [float]$Inner,
    [System.Drawing.Brush]$Brush
  )

  $points = [System.Drawing.PointF[]]@(
    (New-PointF $CenterX ($CenterY - $Outer)),
    (New-PointF ($CenterX + $Inner) ($CenterY - $Inner)),
    (New-PointF ($CenterX + $Outer) $CenterY),
    (New-PointF ($CenterX + $Inner) ($CenterY + $Inner)),
    (New-PointF $CenterX ($CenterY + $Outer)),
    (New-PointF ($CenterX - $Inner) ($CenterY + $Inner)),
    (New-PointF ($CenterX - $Outer) $CenterY),
    (New-PointF ($CenterX - $Inner) ($CenterY - $Inner))
  )

  $Graphics.FillPolygon($Brush, $points)
}

function New-BrandIcon {
  param(
    [string]$Path,
    [int]$Size
  )

  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $scale = $Size / 64.0
  $graphics.ScaleTransform($scale, $scale)

  $background = New-RoundedRectPath -X 4 -Y 4 -Width 56 -Height 56 -Radius 14
  $backgroundBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    (New-PointF 10 8),
    (New-PointF 54 56),
    (New-HtmlColor '#fff7ef'),
    (New-HtmlColor '#fff0e0')
  )
  $graphics.FillPath($backgroundBrush, $background)

  $stickPen = [System.Drawing.Pen]::new((New-HtmlColor '#6f4d39'), 3)
  $stickPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $stickPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawLine($stickPen, 17, 54, 40, 10)

  Draw-GradientBerry -Graphics $graphics -CenterX 39 -CenterY 15 -Radius 8 -StartColor '#ffb39c' -MidColor '#d64a34' -EndColor '#8f1f16' -HighlightX 33.5 -HighlightY 10.1 -HighlightWidth 5 -HighlightHeight 3.8 -HighlightAlpha 184
  Draw-GradientBerry -Graphics $graphics -CenterX 33 -CenterY 28 -Radius 9 -StartColor '#ffb59d' -MidColor '#db4f37' -EndColor '#971f16' -HighlightX 26.2 -HighlightY 22.1 -HighlightWidth 5.6 -HighlightHeight 4.2 -HighlightAlpha 168
  Draw-GradientBerry -Graphics $graphics -CenterX 26 -CenterY 43 -Radius 10 -StartColor '#ffbba2' -MidColor '#df573c' -EndColor '#9e261a' -HighlightX 17.8 -HighlightY 35.7 -HighlightWidth 6.2 -HighlightHeight 4.6 -HighlightAlpha 158

  $glowPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(105, 255, 242, 232), 1.0)
  $glowPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $glowPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawArc($glowPen, 20, 33, 17, 17, 40, 56)

  $sparkleBrush = [System.Drawing.SolidBrush]::new((New-HtmlColor '#f4b65c'))
  Draw-Sparkle -Graphics $graphics -CenterX 49 -CenterY 13 -Outer 4 -Inner 1.6 -Brush $sparkleBrush

  $sparkleBrush.Dispose()
  $glowPen.Dispose()
  $stickPen.Dispose()
  $backgroundBrush.Dispose()
  $background.Dispose()

  $directory = Split-Path -Parent $Path
  if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }

  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

  $graphics.Dispose()
  $bitmap.Dispose()
}

$publicDir = Join-Path $PSScriptRoot '..\public'
New-BrandIcon -Path (Join-Path $publicDir 'apple-touch-icon.png') -Size 180
New-BrandIcon -Path (Join-Path $publicDir 'favicon-32x32.png') -Size 32
