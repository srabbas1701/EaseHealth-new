$body = @{
    type = 'INSERT'
    table = 'appointments'
    record = @{
        id = 'fb1557fd-1d5e-47b2-97bc-6d910a5d50ae'
        doctor_id = 'c4fd00c8-f8b9-4b12-b2d6-087f6c55d852'
        patient_id = 'a4eae263-5274-49c6-9b94-e2ce93ad00d2'
        schedule_date = '2025-11-24'
        start_time = '16:45:00'
        queue_token = 'QT-20251113-0003'
    }
} | ConvertTo-Json -Depth 10

Write-Host "Payload:"
Write-Host $body
Write-Host "`n---`n"

$response = Invoke-RestMethod -Uri 'http://localhost:5678/webhook/appointment-notification' -Method Post -Body $body -ContentType 'application/json'

Write-Host "Response:"
Write-Host ($response | ConvertTo-Json -Depth 10)



