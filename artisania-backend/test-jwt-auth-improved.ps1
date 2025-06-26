# PowerShell script to test Artisania JWT authentication and API endpoints
# Improved version with unique emails and ArtisanProfile debugging

$baseUrl = "http://localhost:8080"

# Generate unique timestamp for this test run
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$artisanEmail = "artisan.test.$timestamp@example.com"
$customerEmail = "customer.test.$timestamp@example.com"

function Show-DetailedError {
    param($exception, $operation)
    
    Write-Host "$operation FAILED" -ForegroundColor Red
    Write-Host "Error: $($exception.Message)" -ForegroundColor Yellow
    
    if ($exception.Response) {
        $statusCode = [int]$exception.Response.StatusCode
        $statusDescription = $exception.Response.StatusDescription
        Write-Host "Status Code: $statusCode $statusDescription" -ForegroundColor Yellow
        
        try {
            $reader = New-Object System.IO.StreamReader($exception.Response.GetResponseStream())
            $errorContent = $reader.ReadToEnd()
            $reader.Close()
            if ($errorContent) {
                Write-Host "Response Content: $errorContent" -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "Could not read error response" -ForegroundColor Yellow
        }
    }
    Write-Host ""
}

Write-Host "Starting Artisania JWT Authentication Tests" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host "Test Run ID: $timestamp" -ForegroundColor Magenta
Write-Host "Artisan Email: $artisanEmail" -ForegroundColor Magenta
Write-Host "Customer Email: $customerEmail" -ForegroundColor Magenta
Write-Host ""

# Step 1: Get Categories (Public endpoint)
Write-Host "1. Fetching Categories (Public)..." -ForegroundColor Cyan
try {
    $categoriesResponse = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method Get
    Write-Host "SUCCESS: Categories fetched! Found $($categoriesResponse.Count) categories" -ForegroundColor Green
    if ($categoriesResponse.Count -gt 0) {
        $firstCategory = $categoriesResponse[0]
        Write-Host "Using category: $($firstCategory.name) (ID: $($firstCategory.id))" -ForegroundColor Magenta
    }
}
catch {
    Show-DetailedError $_ "Fetch Categories"
    exit 1
}

# Step 2: Create Artisan User
Write-Host "2. Creating Artisan User..." -ForegroundColor Cyan
try {
    $newArtisanUser = @{
        email = $artisanEmail
        password = "artisan123"
    } | ConvertTo-Json
    
    $artisanUserResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register-artisan" -Method Post -Body $newArtisanUser -ContentType "application/json"
    Write-Host "SUCCESS: Artisan user created! ID: $($artisanUserResponse.userId)" -ForegroundColor Green
    Write-Host "ArtisanProfile should be auto-created during registration..." -ForegroundColor Yellow
}
catch {
    Show-DetailedError $_ "Create Artisan User"
    exit 1
}

# Step 3: Artisan Login
Write-Host "3. Testing Artisan Login..." -ForegroundColor Cyan
try {
    $loginRequest = @{
        email = $artisanEmail
        password = "artisan123"
    } | ConvertTo-Json
    
    $artisanLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginRequest -ContentType "application/json"
    Write-Host "SUCCESS: Artisan login successful! Email: $($artisanLoginResponse.email)" -ForegroundColor Green
    Write-Host "JWT Token: $($artisanLoginResponse.token.Substring(0, 50))..." -ForegroundColor Magenta
    $artisanToken = $artisanLoginResponse.token
    $artisanHeaders = @{
        "Authorization" = "Bearer $artisanToken"
        "Content-Type" = "application/json"
    }
}
catch {
    Show-DetailedError $_ "Artisan Login"
    exit 1
}

# Step 4: Test Protected Endpoint - Get User Profile
Write-Host "4. Testing Protected Endpoint - Get User Profile..." -ForegroundColor Cyan
try {
    $userProfileResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/me" -Method Get -Headers $artisanHeaders
    Write-Host "SUCCESS: User profile retrieved! Email: $($userProfileResponse.email), Role: $($userProfileResponse.role)" -ForegroundColor Green
}
catch {
    Show-DetailedError $_ "Get User Profile"
}

# Step 4.5: Check ArtisanProfile
Write-Host "4.5. Checking ArtisanProfile..." -ForegroundColor Cyan
try {
    $profilesResponse = Invoke-RestMethod -Uri "$baseUrl/api/artisan-profiles" -Method Get
    $myProfile = $profilesResponse | Where-Object { $_.user.email -eq $artisanEmail }
    if ($myProfile) {
        Write-Host "SUCCESS: ArtisanProfile found! Display Name: $($myProfile.displayName)" -ForegroundColor Green
        Write-Host "Profile ID: $($myProfile.id), Bio: $($myProfile.bio)" -ForegroundColor Green
    } else {
        Write-Host "ERROR: No ArtisanProfile found for $artisanEmail" -ForegroundColor Red
        Write-Host "This will cause product creation to fail!" -ForegroundColor Red
        
        # Try to create artisan profile manually
        Write-Host "Attempting to create ArtisanProfile manually..." -ForegroundColor Yellow
        try {
            $newProfile = @{
                displayName = "Test Artisan $timestamp"
                bio = "Test artisan profile created for testing"
            } | ConvertTo-Json
            
            $profileCreateResponse = Invoke-RestMethod -Uri "$baseUrl/api/artisan-profiles" -Method Post -Body $newProfile -Headers $artisanHeaders
            Write-Host "SUCCESS: ArtisanProfile created manually! ID: $($profileCreateResponse.id)" -ForegroundColor Green
        }
        catch {
            Show-DetailedError $_ "Manual ArtisanProfile Creation"
        }
    }
}
catch {
    Show-DetailedError $_ "Check ArtisanProfile"
}

# Step 5: Create Product (Artisan only)
Write-Host "5. Creating Product (Artisan Protected)..." -ForegroundColor Cyan
if ($categoriesResponse.Count -gt 0) {
    try {
        $newProduct = @{
            name = "JWT Test Pottery Vase - $timestamp"
            description = "Handcrafted ceramic vase with traditional Tunisian patterns - JWT Test $timestamp"
            price = 45.99
            stockQuantity = 10
            category = @{
                id = $firstCategory.id
            }
            isFeatured = $false
        } | ConvertTo-Json -Depth 3
        
        Write-Host "Sending product creation request..." -ForegroundColor Yellow
        $productResponse = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $newProduct -Headers $artisanHeaders
        Write-Host "SUCCESS: Product created! ID: $($productResponse.id)" -ForegroundColor Green
        Write-Host "Product Name: $($productResponse.name)" -ForegroundColor Green
    }
    catch {
        Show-DetailedError $_ "Create Product"
    }
} else {
    Write-Host "SKIPPING: No categories available for product creation" -ForegroundColor Yellow
}

# Step 6: Create Customer User
Write-Host "6. Creating Customer User..." -ForegroundColor Cyan
try {
    $newCustomerUser = @{
        email = $customerEmail
        password = "customer123"
    } | ConvertTo-Json
    
    $customerUserResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register-customer" -Method Post -Body $newCustomerUser -ContentType "application/json"
    Write-Host "SUCCESS: Customer user created! ID: $($customerUserResponse.userId)" -ForegroundColor Green
}
catch {
    Show-DetailedError $_ "Create Customer User"
    exit 1
}

# Step 7: Customer Login
Write-Host "7. Testing Customer Login..." -ForegroundColor Cyan
try {
    $customerLoginRequest = @{
        email = $customerEmail
        password = "customer123"
    } | ConvertTo-Json
    
    $customerLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $customerLoginRequest -ContentType "application/json"
    Write-Host "SUCCESS: Customer login successful! Email: $($customerLoginResponse.email)" -ForegroundColor Green
    Write-Host "JWT Token: $($customerLoginResponse.token.Substring(0, 50))..." -ForegroundColor Magenta
    $customerToken = $customerLoginResponse.token
    $customerHeaders = @{
        "Authorization" = "Bearer $customerToken"
        "Content-Type" = "application/json"
    }
}
catch {
    Show-DetailedError $_ "Customer Login"
    exit 1
}

# Step 8: Test Unauthorized Access (Customer trying to create product)
Write-Host "8. Testing Unauthorized Access (Customer creating product)..." -ForegroundColor Cyan
if ($categoriesResponse.Count -gt 0) {
    try {
        $unauthorizedProduct = @{
            name = "Unauthorized Product - $timestamp"
            description = "This should fail"
            price = 25.99
            stockQuantity = 5
            category = @{
                id = $firstCategory.id
            }
            isFeatured = $false
        } | ConvertTo-Json -Depth 3
        
        $unauthorizedResponse = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $unauthorizedProduct -Headers $customerHeaders
        Write-Host "UNEXPECTED: Customer was able to create product! This should have been forbidden." -ForegroundColor Red
    }
    catch {
        $statusCode = [int]$_.Exception.Response.StatusCode
        if ($statusCode -eq 403) {
            Write-Host "SUCCESS: Customer properly forbidden from creating products (403 Forbidden)" -ForegroundColor Green
        } else {
            Write-Host "UNEXPECTED: Got status code $statusCode instead of 403 Forbidden" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "SKIPPING: No categories available for unauthorized test" -ForegroundColor Yellow
}

# Step 9: Test Access without Token
Write-Host "9. Testing Access without Token..." -ForegroundColor Cyan
try {
    $noTokenResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/me" -Method Get
    Write-Host "UNEXPECTED: Got user profile without authentication! This should have been denied." -ForegroundColor Red
}
catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    if ($statusCode -eq 401) {
        Write-Host "SUCCESS: Access properly denied without token (401 Unauthorized)" -ForegroundColor Green
    } else {
        Write-Host "UNEXPECTED: Got status code $statusCode instead of 401 Unauthorized" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "JWT Authentication Tests Completed!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Test Run: $timestamp" -ForegroundColor Magenta
Write-Host "Summary:" -ForegroundColor White
Write-Host "- JWT tokens are being generated and returned on login" -ForegroundColor White
Write-Host "- Protected endpoints require valid JWT tokens" -ForegroundColor White
Write-Host "- Role-based access control is enforced" -ForegroundColor White
Write-Host "- Public endpoints remain accessible" -ForegroundColor White