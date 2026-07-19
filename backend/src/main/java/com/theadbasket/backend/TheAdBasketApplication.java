package com.theadbasket.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/** Entry point for The AdBasket backend REST API. */
@SpringBootApplication
@ConfigurationPropertiesScan
public class TheAdBasketApplication {

    public static void main(String[] args) {
        SpringApplication.run(TheAdBasketApplication.class, args);
    }
}
