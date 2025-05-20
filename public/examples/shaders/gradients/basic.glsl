void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
	vec2 q = uv - vec2(0.5, 0.0);
    
    vec3 col = mix(vec3(0.8, 0.1, 0.7), vec3(0.4, 0.2, 1), uv.y);
    
    float r = 0.8 + sin(.05)*sin(iTime)*2.0*cos(atan(q.x, q.y) * 0.0 + 10.0* q.x+1.0);
    r += cos(0.5*iTime*(q.y*0.17))*0.01;
    
    col += smoothstep(r+.1 , sin(r) * 0.5+0.1+0.1, length(q));
    
    col *= fract(uv.y);

    fragColor = vec4(col,1.0);
}

