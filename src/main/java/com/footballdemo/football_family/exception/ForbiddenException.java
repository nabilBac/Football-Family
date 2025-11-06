package com.footballdemo.football_family.exception;



public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}