package com.architecturalthinking.mediaos.workflow;

import java.util.LinkedHashMap;
import java.util.Map;

public final class Ep001SemanticAnchorCatalog {

    private Ep001SemanticAnchorCatalog() {}

    public static LinkedHashMap<String, String> anchorsFor(String shotKey) {
        return switch (shotKey) {
            case "SHOT 01" -> linked(
                    "PRESS_LOGIN", "press Login",
                    "LOGIN_INTENT", "Login Intent",
                    "CREDENTIAL_INPUT", "Credential Input",
                    "LOCAL_UI_STATE", "Local UI State"
            );
            case "SHOT 02" -> linked(
                    "VALIDATE", "Validates",
                    "SUBMIT", "Submit",
                    "REQUEST_ASSEMBLY", "Request Assembly",
                    "PAYLOAD", "Payload",
                    "HEADERS", "Headers",
                    "REQUEST_CONTEXT", "Request Context",
                    "REQUEST_READY", "structured message ready"
            );
            case "SHOT 03" -> linked(
                    "REQUEST_ASSEMBLY", "Request Assembly",
                    "PAYLOAD", "Payload",
                    "HEADERS", "Headers",
                    "REQUEST_CONTEXT", "Request Context",
                    "NETWORK_TRANSIT", "Network Transit",
                    "READY_NOT_SENT", "Ready is not the same as sent"
            );
            case "SHOT 04" -> linked(
                    "DNS_RESOLUTION", "DNS Resolution",
                    "RESOLVE", "Resolve",
                    "CACHE", "Cache",
                    "NETWORK_TRANSIT", "Network Transit",
                    "NETWORK_LATENCY", "Network Latency",
                    "RTT", "RTT",
                    "JITTER", "Jitter"
            );
            case "SHOT 05" -> linked(
                    "API_GATEWAY", "API Gateway",
                    "ROUTING", "Routing",
                    "PATH", "Path",
                    "METHOD", "Method",
                    "RATE_LIMIT", "Rate Limit",
                    "BURST", "Burst",
                    "QUOTA", "Quota",
                    "REQUEST_FILTER", "Request Filter",
                    "WAF", "WAF",
                    "SCHEMA", "Schema"
            );
            case "SHOT 06" -> linked(
                    "LOAD_BALANCER", "Load Balancer",
                    "TRAFFIC_DISTRIBUTION", "Traffic Distribution",
                    "ROUTE_MODE", "Route Mode",
                    "HASH_KEY", "Hash Key",
                    "HEALTH_CHECKS", "Health Checks",
                    "HEALTHY", "Healthy",
                    "TIMEOUT", "Timeout",
                    "TARGET_CHOICE", "Target Choice",
                    "INSTANCE", "Instance",
                    "ZONE", "Zone"
            );
            case "SHOT 07" -> linked(
                    "AUTH_SERVICE", "Auth Service",
                    "VALIDATION_STEPS", "Validation Steps",
                    "TOKEN_STATUS", "Token Status",
                    "EXPIRED", "Expired",
                    "REVOKED", "Revoked",
                    "USER_LOOKUP", "User Lookup",
                    "USER_ID", "User ID",
                    "USERNAME", "Username"
            );
            case "SHOT 08" -> linked(
                    "USER_DATABASE", "User Database",
                    "USER_DATA", "User Data",
                    "PROFILE", "Profile",
                    "SETTINGS", "Settings",
                    "ACCESS_RIGHTS", "Access Rights",
                    "ROLE", "Role",
                    "SCOPES", "Scopes",
                    "SESSION_MANAGEMENT", "Session Management",
                    "CREATE", "Create",
                    "REFRESH", "Refresh"
            );
            case "SHOT 09" -> linked(
                    "AUTH_SERVICE", "Auth Service",
                    "USER_DATABASE_SLOW", "User Database is slow",
                    "USER_LOOKUP_WAITING", "User Lookup waits",
                    "LOGIN_STILL_BROKEN", "Auth Service is healthy but Login is still broken",
                    "FAILURE_RESPONSE", "Failure Response"
            );
            case "SHOT 10" -> linked(
                    "EXPIRED_SESSION", "Expired Session",
                    "REFRESH_EXPIRED_TOKEN", "Refresh expired token",
                    "FRESH_AUTH_REQUIRED", "Fresh Auth Required",
                    "INVALID_TOKEN", "Invalid Token",
                    "SIGNATURE", "Signature",
                    "MALFORMED", "Malformed",
                    "ACCOUNT_STATUS", "Account Status",
                    "ACCOUNT_LOCKED", "Account Locked",
                    "DISABLED", "Disabled",
                    "CONTACT_SUPPORT", "Contact Support",
                    "ACCESS_DENIED", "Access Denied",
                    "FAILURE_RESPONSE", "Failure Response"
            );
            case "SHOT 11" -> linked(
                    "USER_DATABASE", "User Database",
                    "AUTH_SERVICE", "Auth Service",
                    "CREDENTIAL_MATCH", "it matches",
                    "NOT_LOGGED_IN_YET", "phone is not logged in yet",
                    "AUTHENTICATION_STATE", "Authentication State",
                    "PASSWORD_NOT_PERSISTENT_PROOF", "does not by itself keep you logged in"
            );
            case "SHOT 12" -> linked(
                    "AUTHENTICATION_STATE", "Authentication State",
                    "SESSION_CREATION", "Session Creation",
                    "SESSION_ID", "Session ID",
                    "TOKEN", "Token",
                    "JWT", "JSON Web Token",
                    "TTL", "TTL",
                    "COOKIE", "Cookie",
                    "SET_COOKIE", "Set Cookie",
                    "RESPONSE_PREP", "Response Prep",
                    "USER_DATA", "User Data",
                    "REDIRECT", "Redirect"
            );
            case "SHOT 13" -> linked(
                    "AUTHENTICATION_STATE", "Authentication State",
                    "ROUTE_DECISION", "Route Decision",
                    "CONFIRMED", "Confirmed",
                    "AUTHENTICATED", "Authenticated",
                    "REDIRECT", "Redirect",
                    "DASHBOARD", "Dashboard",
                    "IDENTITY_APPLIED", "Identity Applied"
            );
            case "SHOT 14" -> linked(
                    "SESSION_RESTORE_FLOW", "Session Restore Flow",
                    "USE_REFRESH_TOKEN", "Use Refresh Token",
                    "VALIDATE_NEW_TOKEN", "Validate New Token",
                    "RESTORE_SESSION_CONTEXT", "Restore Session Context"
            );
            case "SHOT 15" -> linked(
                    "LOGIN_REQUEST", "Login Request",
                    "API_GATEWAY", "API Gateway",
                    "LOAD_BALANCER", "Load Balancer",
                    "AUTH_SERVICE", "Auth Service",
                    "USER_DATA", "User Data",
                    "AUTHENTICATION_STATE", "Authentication State",
                    "LOGIN_NOT_PASSWORD_CHECK", "Login is not a password check"
            );
            case "SHOT 16" -> linked(
                    "DASHBOARD", "Dashboard",
                    "AUTHENTICATION_PROOF", "authentication proof",
                    "SESSION_ID", "Session ID",
                    "COOKIE", "Cookie",
                    "JWT", "JSON Web Token",
                    "PASSWORD_GONE", "once the password is gone"
            );
            default -> new LinkedHashMap<>();
        };
    }

    private static LinkedHashMap<String, String> linked(String... values) {
        LinkedHashMap<String, String> result = new LinkedHashMap<>();
        for (int i = 0; i + 1 < values.length; i += 2) {
            result.put(values[i], values[i + 1]);
        }
        return result;
    }
}
