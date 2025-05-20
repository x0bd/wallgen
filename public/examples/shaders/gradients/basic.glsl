//
// Demonstrates high-quality and proper gamma-corrected color gradient.
//
// Does interpolation in linear color space, mixing colors using smoothstep function.
// Also adds some gradient noise to reduce banding.
//
// References:
// http://blog.johnnovak.net/2016/09/21/what-every-coder-should-know-about-gamma/
// https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch24.html
// http://loopit.dk/banding_in_games.pdf
//
// This shader is dedicated to public domain.
//

#define SRGB_TO_LINEAR(c) pow((c), vec3(2.2))
#define LINEAR_TO_SRGB(c) pow((c), vec3(1.0 / 2.2))
#define SRGB(r, g, b) SRGB_TO_LINEAR(vec3(float(r), float(g), float(b)) / 255.0)

const vec3 COLOR0 = SRGB(255, 0, 114);
const vec3 COLOR1 = SRGB(197, 255, 80);

// Gradient noise from Jorge Jimenez's presentation:
// http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare
float gradientNoise(in vec2 uv)
{
    const vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
    return fract(magic.z * fract(dot(uv, magic.xy)));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 a; // First gradient point.
    vec2 b; // Second gradient point.
    if (iMouse == vec4(0.0)) {
        a = 0.1 * iResolution.xy;
        b = iResolution.xy;
    } else {
        a = abs(iMouse.zw);
        b = iMouse.xy;
    }

    // Calculate interpolation factor with vector projection.
    vec2 ba = b - a;
    float t = dot(fragCoord - a, ba) / dot(ba, ba);
    // Saturate and apply smoothstep to the factor.
    t = smoothstep(0.0, 1.0, clamp(t, 0.0, 1.0));
    // Interpolate.
    vec3 color = mix(COLOR0, COLOR1, t);

    // Convert color from linear to sRGB color space (=gamma encode).
    color = LINEAR_TO_SRGB(color);

    // Add gradient noise to reduce banding.
    color += (1.0/255.0) * gradientNoise(fragCoord) - (0.5/255.0);

    fragColor = vec4(color, 1.0);
}
