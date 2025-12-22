package com.footballdemo.football_family.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class DebugInterceptor implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(
                    jakarta.servlet.http.HttpServletRequest request,
                    jakarta.servlet.http.HttpServletResponse response,
                    Object handler
            ) {
                System.out.println("➡️ Handler intercepté : " + handler);
                System.out.println("➡️ URL appelée : " + request.getRequestURL());
                return true;
            }
        });
    }
}
