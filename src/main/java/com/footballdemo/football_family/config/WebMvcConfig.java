package com.footballdemo.football_family.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

import java.io.IOException;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${videos.upload.dir}")
    private String videosDir;

    @Value("${uploads.dir}")
    private String uploadsDir;

    @Override
public void addResourceHandlers(ResourceHandlerRegistry registry) {

    // 🟩 RESSOURCES STATIQUES
    registry.addResourceHandler("/css/**")
            .addResourceLocations("classpath:/static/css/");
    
    registry.addResourceHandler("/js/**")
            .addResourceLocations("classpath:/static/js/");
    
    registry.addResourceHandler("/app/**")
            .addResourceLocations("classpath:/static/app/");
    
    registry.addResourceHandler("/assets/**")
            .addResourceLocations("classpath:/static/assets/");

    // ❌ ENLÈVE ÇA (ou commente)
    // registry.addResourceHandler("/videos/**")
    //         .addResourceLocations("file:" + Paths.get(videosDir).toAbsolutePath() + "/");

    // ✅ GARDE JUSTE LES UPLOADS (images, etc.)
    registry.addResourceHandler("/uploads/**")
            .addResourceLocations("file:" + Paths.get(uploadsDir).toAbsolutePath() + "/");

    // 🟩 SERVICE WORKER / MANIFEST
    registry.addResourceHandler("/service-worker.js")
            .addResourceLocations("classpath:/static/")
            .setCachePeriod(0);

    registry.addResourceHandler("/manifest.json")
            .addResourceLocations("classpath:/static/");
}

@Override
public void addViewControllers(ViewControllerRegistry registry) {

    // SPA routes = pas d'assets (pas de ".") + exclusions API / WS / fichiers servis
    registry.addViewController("/{path:^(?!api|ws|videos|uploads|css|js|assets|app|webjars|actuator|error$)[^\\.]*$}")
            .setViewName("forward:/");

    registry.addViewController("/**/{path:^(?!api|ws|videos|uploads|css|js|assets|app|webjars|actuator|error$)[^\\.]*$}")
            .setViewName("forward:/");
}



    @Bean
    public FilterRegistrationBean<ServiceWorkerFilter> swFilter() {
        FilterRegistrationBean<ServiceWorkerFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(new ServiceWorkerFilter());
        bean.addUrlPatterns("/service-worker.js");
        return bean;
    }
}

class ServiceWorkerFilter implements Filter {
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        ((HttpServletResponse) res)
                .setContentType("application/javascript; charset=UTF-8");
        chain.doFilter(req, res);
    }
}
