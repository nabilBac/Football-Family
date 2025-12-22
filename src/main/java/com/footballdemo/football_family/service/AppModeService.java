package com.footballdemo.football_family.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AppModeService {

    @Value("${app.mode-dev:false}")
    private boolean modeDev;

    public boolean isDev() {
        return modeDev;
    }
}
