# Artisania Backend - RBAC Diagnostic Testing Script
# Identifies specific issues with RBAC implementation

$baseUrl = "http://localhost:8080"
$timestamp = Get-Date -Format "yyyyMMddHHmmss"

# Test credentials - using correct admin email
$adminEmail = "admin@artisania.tn"
$artisanEmail = "artisan.test.$timestamp@example.com"
$customerEmail = "customer.test.$timestamp@example.com"

function Test-Request {
    param($description, $uri, $method, $headers, $body, $shouldSucceed)
    
    Write-Host "Testing: $description"
    try {
        $params = @{
            Uri = $uri
            Method = $method
        }
        
        if ($headers) { $params.Headers = $headers }
        if ($body) { 
            $params.Body = $body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @params
        
        if ($shouldSucceed) {
            Write-Host "PASS: $description" -ForegroundColor Green
            return $response
        } else {
            Write-Host "FAIL: Should have been blocked but succeeded" -ForegroundColor Red
            return $response
        }
    }
    catch {
        $statusCode = [int]$_.Exception.Response.StatusCode
        $errorMessage = $_.Exception.Message
        
        if (-not $shouldSucceed) {
            Write-Host "PASS: Correctly blocked (Status: $statusCode)" -ForegroundColor Green
            return $null
        } else {
            Write-Host "FAIL: $description" -ForegroundColor Red
            Write-Host "      Status: $statusCode" -ForegroundColor Yellow
            Write-Host "      Error: $errorMessage" -ForegroundColor Yellow
            
            # Try to get more error details
            if ($_.Exception.Response) {
                try {
                    $stream = $_.Exception.Response.GetResponseStream()
                    $reader = New-Object System.IO.StreamReader($stream)
                    $responseBody = $reader.ReadToEnd()
                    if ($responseBody) {
                        Write-Host "      Response: $responseBody" -ForegroundColor Yellow
                    }
                }
                catch {
                    # Ignore if we can't read response body
                }
            }
            return $null
        }
    }
}

function Show-UserInfo {
    param($description, $userResponse)
    if ($userResponse) {
        Write-Host "$description Role Check:" -ForegroundColor Cyan
        Write-Host "  Email: $($userResponse.email)" -ForegroundColor White
        Write-Host "  Role: $($userResponse.role)" -ForegroundColor White
        Write-Host "  User ID: $($userResponse.userId)" -ForegroundColor White
        Write-Host ""
    }
}

Write-Host "Artisania RBAC Diagnostic Testing"
Write-Host "================================="
Write-Host "Test Run: $timestamp"
Write-Host ""

# PHASE 1: User Creation and Role Verification
Write-Host "PHASE 1: User Creation and Role Verification"
Write-Host "--------------------------------------------"

# Create users
$adminUser = @{ email = $adminEmail; password = "admin123"; role = "ADMIN" } | ConvertTo-Json
$artisanUser = @{ email = $artisanEmail; password = "artisan123" } | ConvertTo-Json
$customerUser = @{ email = $customerEmail; password = "customer123" } | ConvertTo-Json

$adminResponse = Test-Request "Create Admin User" "$baseUrl/auth/register" "POST" $null $adminUser $true
$artisanResponse = Test-Request "Create Artisan User" "$baseUrl/auth/register-artisan" "POST" $null $artisanUser $true
$customerResponse = Test-Request "Create Customer User" "$baseUrl/auth/register-customer" "POST" $null $customerUser $true

# Handle admin login (user may already exist)
Write-Host "`nLogging in users..." -ForegroundColor Yellow

# Admin Login
$adminLogin = @{ email = $adminEmail; password = "admin123" } | ConvertTo-Json
try {
    $adminLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLogin -ContentType "application/json"
    $adminHeaders = @{ Authorization = "Bearer $($adminLoginResponse.token)" }
    Write-Host "PASS: Admin login successful" -ForegroundColor Green
    Show-UserInfo "Admin" $adminLoginResponse
} catch {
    Write-Host "FAIL: Admin login failed - $($_.Exception.Message)" -ForegroundColor Red
    $adminHeaders = $null
    $adminLoginResponse = $null
}

# Artisan Login
$artisanLogin = @{ email = $artisanEmail; password = "artisan123" } | ConvertTo-Json
try {
    $artisanLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $artisanLogin -ContentType "application/json"
    $artisanHeaders = @{ Authorization = "Bearer $($artisanLoginResponse.token)" }
    Write-Host "PASS: Artisan login successful" -ForegroundColor Green
    Show-UserInfo "Artisan" $artisanLoginResponse
} catch {
    Write-Host "FAIL: Artisan login failed - $($_.Exception.Message)" -ForegroundColor Red
    $artisanHeaders = $null
    $artisanLoginResponse = $null
}

# Customer Login
$customerLoginBody = @{
    email = $customerEmail
    password = "customer123"
} | ConvertTo-Json

try {
    $customerLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $customerLoginBody -ContentType "application/json"
    $customerToken = $customerLoginResponse.token
    $customerId = $customerLoginResponse.userId
    $customerHeaders = @{ Authorization = "Bearer $customerToken" }
    Write-Host "PASS: Customer login successful" -ForegroundColor Green
    Show-UserInfo "Customer" $customerLoginResponse
} catch {
    Write-Host "FAIL: Customer login failed - $($_.Exception.Message)" -ForegroundColor Red
    $customerHeaders = $null
    $customerId = $null
}

# Check actual user roles and verify they can access their profiles
Write-Host "`nVerifying user profiles and roles..." -ForegroundColor Yellow

if ($adminLoginResponse) {
    $adminProfile = Test-Request "Get Admin Profile" "$baseUrl/api/users/me" "GET" $adminHeaders $null $true
    if ($adminProfile) {
        Show-UserInfo "ADMIN USER" $adminProfile
        if ($adminProfile.role -ne "ADMIN") {
            Write-Host "CRITICAL ISSUE: Admin user has role '$($adminProfile.role)' instead of 'ADMIN'" -ForegroundColor Red
            Write-Host "This will cause all admin operations to fail!" -ForegroundColor Red
            Write-Host ""
        }
    }
}

if ($artisanLoginResponse) {
    $artisanProfile = Test-Request "Get Artisan Profile" "$baseUrl/api/users/me" "GET" $artisanHeaders $null $true
    if ($artisanProfile) {
        Show-UserInfo "ARTISAN USER" $artisanProfile
    }
}

if ($customerLoginResponse) {
    $customerProfile = Test-Request "Get Customer Profile" "$baseUrl/api/users/me" "GET" $customerHeaders $null $true
    if ($customerProfile) {
        Show-UserInfo "CUSTOMER USER" $customerProfile
    }
}

# PHASE 2: Endpoint Availability Check
Write-Host "PHASE 2: Endpoint Availability Check"
Write-Host "------------------------------------"

# Check if endpoints exist
Test-Request "Check Categories Endpoint" "$baseUrl/api/categories" "GET" $null $null $true
Test-Request "Check Products Endpoint" "$baseUrl/api/products" "GET" $null $null $true
Test-Request "Check Users Endpoint (Admin)" "$baseUrl/api/users" "GET" $adminHeaders $null $true
Test-Request "Check Artisan Profiles Endpoint" "$baseUrl/api/artisans" "GET" $artisanHeaders $null $true

Write-Host ""

# PHASE 3: Role-Based Access Testing (if roles are correct)
Write-Host "PHASE 3: Role-Based Access Testing"
Write-Host "----------------------------------"

if ($adminProfile -and $adminProfile.role -eq "ADMIN") {
    Write-Host "Testing Admin Actions (with correct ADMIN role)..."
    
    $newCategory = @{
        name = "Test Category - $timestamp"
        slug = "test-category-$timestamp"
    } | ConvertTo-Json

    Test-Request "Admin: Create Category" "$baseUrl/api/categories" "POST" $adminHeaders $newCategory $true
    Test-Request "Admin: Get All Users" "$baseUrl/api/users" "GET" $adminHeaders $null $true
} else {
    Write-Host "SKIPPING Admin Actions - Admin role not properly assigned" -ForegroundColor Yellow
}

if ($artisanProfile -and $artisanProfile.role -eq "ARTISAN") {
    Write-Host "Testing Artisan Actions..."
    
    # Try to get categories first for product creation
    try {
        $categoriesResponse = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method Get
        if ($categoriesResponse -and $categoriesResponse.Count -gt 0) {
            $firstCategory = $categoriesResponse[0]
            
            $newProduct = @{
                name = "Test Product - $timestamp"
                description = "Test product for RBAC"
                price = 29.99
                stockQuantity = 5
                category = @{ id = $firstCategory.id }
                isFeatured = $false
            } | ConvertTo-Json -Depth 3

            $productResponse = Test-Request "Artisan: Create Product" "$baseUrl/api/products" "POST" $artisanHeaders $newProduct $true
        } else {
            Write-Host "No categories available for product creation test" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "Could not retrieve categories for product test" -ForegroundColor Yellow
    }
}

Write-Host ""

# PHASE 4: Issue Summary
Write-Host "ISSUE SUMMARY"
Write-Host "============="

$issuesFound = 0

if ($adminProfile -and $adminProfile.role -ne "ADMIN") {
    Write-Host "ISSUE 1: Admin user registration assigns wrong role" -ForegroundColor Red
    Write-Host "  Expected: ADMIN, Got: $($adminProfile.role)" -ForegroundColor Red
    $issuesFound++
}

# Check for 500 errors in products endpoint
try {
    Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get | Out-Null
}
catch {
    if ([int]$_.Exception.Response.StatusCode -eq 500) {
        Write-Host "ISSUE 2: Products endpoint returns server error (500)" -ForegroundColor Red
        $issuesFound++
    }
}

# Check for missing artisan profiles endpoint
try {
    Invoke-RestMethod -Uri "$baseUrl/api/artisans" -Method Get -Headers $artisanHeaders | Out-Null
}
catch {
    if ([int]$_.Exception.Response.StatusCode -eq 404) {
        Write-Host "ISSUE 3: Artisan profiles endpoint not found (404)" -ForegroundColor Red
        Write-Host "  Endpoint /api/artisans may not be implemented" -ForegroundColor Red
        $issuesFound++
    }
}

# Check for orders endpoint access
try {
    if ($customerHeaders) {
        Invoke-RestMethod -Uri "$baseUrl/api/orders/customer/$customerId" -Method Get -Headers $customerHeaders | Out-Null
    }
}
catch {
    if ([int]$_.Exception.Response.StatusCode -eq 404) {
        Write-Host "ISSUE 4: Customer orders endpoint not working" -ForegroundColor Red
        Write-Host "  Customer can't access their own orders" -ForegroundColor Red
        $issuesFound++
    }
}

if ($issuesFound -eq 0) {
    Write-Host "No major issues detected!" -ForegroundColor Green
} else {
    Write-Host "Found $issuesFound issue(s) that need to be fixed" -ForegroundColor Red
}

Write-Host ""
Write-Host "Diagnostic Testing Complete!" -ForegroundColor Cyan 

# Test Customer Actions
Write-Host "`nPhase 5: Testing Customer-Only Actions" -ForegroundColor Cyan
if ($customerHeaders -and $customerId) {
    # Use product ID 1 which exists according to the test output
    $existingProductId = 1
    
    $customerOrderBody = @{
        totalPrice = 29.99
        status = "PENDING"
        shippingName = "Customer Test User"
        shippingAddressLine1 = "123 Test Avenue"
        shippingAddressLine2 = "Apt 4B"
        shippingCity = "Tunis"
        shippingPostalCode = "1000"
        shippingCountry = "Tunisia"
        shippingPhone = "+216 12 345 678"
        orderItems = @(
            @{
                product = @{ id = $existingProductId }
                quantity = 1
                priceAtPurchase = 29.99
            }
        )
    } | ConvertTo-Json -Depth 4
    
    Test-Request "Customer: Create Order" "$baseUrl/api/orders" "POST" $customerHeaders $customerOrderBody $true
    
    # Test customer viewing their own orders
    Test-Request "Customer: View Own Orders" "$baseUrl/api/orders/customer/$customerId" "GET" $customerHeaders $null $true
} else {
    Write-Host "SKIPPING Customer Actions - Customer not properly logged in" -ForegroundColor Yellow
} 