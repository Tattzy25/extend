# Sending data from Shopify to the app

The app reads `style`, `color`, and `customColor` from the **URL query parameters**. From your Shopify page, link to the app with these params.

## URL format

```
https://your-app-url.com/?style={style}&color={color}&customColor={customColor}
```

## Parameters

| Param        | Required | Default           | Example                 |
|-------------|----------|-------------------|-------------------------|
| `style`     | No       | `Blackwork`       | `Traditional`, `Blackwork` |
| `color`     | No       | `Black & White`   | `Black & White`, `Color` |
| `customColor` | No     | `null`           | `#ff0000` (hex)         |

## Example links from Shopify

```liquid
<!-- Minimal - uses defaults -->
<a href="https://your-app.com/">Generate</a>

<!-- With style -->
<a href="https://your-app.com/?style=Traditional">Traditional style</a>

<!-- With style and color -->
<a href="https://your-app.com/?style=Blackwork&color=Black%20%26%20White">Black & white blackwork</a>

<!-- With custom hex color (encode # as %23) -->
<a href="https://your-app.com/?customColor=%23ff0000">Red accent</a>

<!-- Full example -->
<a href="https://your-app.com/?style=Traditional&color=Color&customColor=%23c0c0c0">
  Custom tattoo
</a>
```

## URL encoding

- Use `%20` for spaces (e.g. `Black%20%26%20White` for "Black & White")
- Use `%26` for `&` (e.g. in "Black & White")
- Use `%23` for `#` in hex colors (e.g. `%23ff0000` for `#ff0000`)

## JavaScript / Liquid example

```liquid
{% assign style = product.metafields.custom.tattoo_style | default: "Blackwork" %}
{% assign color = product.metafields.custom.tattoo_color | default: "Black & White" %}
{% assign app_url = "https://your-app.com/?style=" | append: style | append: "&color=" | append: color %}
<a href="{{ app_url }}">Create your tattoo</a>
```
