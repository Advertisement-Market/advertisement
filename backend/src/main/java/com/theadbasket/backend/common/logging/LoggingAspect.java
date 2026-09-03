package com.theadbasket.backend.common.logging;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Auto-logs method entry, exit, and elapsed time for the application's controllers, services, and
 * components at {@code DEBUG} — so individual methods carry no logging boilerplate. Toggle it with
 * the {@code com.theadbasket} log level (DEBUG in dev, INFO in prod).
 *
 * <p><strong>No argument or return values are ever logged.</strong> Request/response objects here
 * routinely carry passwords, JWTs, refresh tokens, and PII; logging only the class, method, and
 * timing keeps those out of the logs entirely. Business-significant events (registration, login,
 * token issuance/cleanup, …) remain explicit {@code INFO}/{@code WARN} logs in the services.
 */
@Aspect
@Component
public class LoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    /**
     * Application controllers and services. Deliberately excludes {@code @Component} beans:
     * servlet filters (e.g. {@code JwtAuthenticationFilter}) are components too, and proxying a
     * filter breaks it — so tracing stays on the request-handling and business layers.
     */
    @Pointcut("(@within(org.springframework.web.bind.annotation.RestController)"
            + " || @within(org.springframework.stereotype.Service))"
            + " && within(com.theadbasket.backend..*)")
    public void applicationBeans() {
    }

    @Around("applicationBeans()")
    public Object logEntryExit(ProceedingJoinPoint joinPoint) throws Throwable {
        // When DEBUG is off (e.g. prod) this short-circuits with near-zero overhead.
        if (!log.isDebugEnabled()) {
            return joinPoint.proceed();
        }
        String target = joinPoint.getSignature().getDeclaringType().getSimpleName()
                + "." + joinPoint.getSignature().getName() + "()";
        long startNanos = System.nanoTime();
        log.debug("→ {}", target);
        try {
            Object result = joinPoint.proceed();
            log.debug("← {} [{} ms]", target, elapsedMillis(startNanos));
            return result;
        } catch (Throwable ex) {
            // The exception is translated to an HTTP response elsewhere; note only where it arose.
            log.debug("✗ {} [{} ms] threw {}", target, elapsedMillis(startNanos),
                    ex.getClass().getSimpleName());
            throw ex;
        }
    }

    private static long elapsedMillis(long startNanos) {
        return (System.nanoTime() - startNanos) / 1_000_000;
    }
}
