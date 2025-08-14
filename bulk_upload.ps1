# Dummy book data: Title | Author | Image URL | PDF URL | GenreId
$books = @(
    "The Silent Forest|John Green|https://images.unsplash.com/photo-1529655683826-aba9b3e77383|C:\Users\Aditya Deshmukh\Downloads\The_Subtleties_of_the_Inimitable_Mulla_Nasrudin.pdf|1",
    "Waves of Time|Emily Carter|https://images.unsplash.com/photo-1507842217343-583bb7270b66|C:\Users\Aditya Deshmukh\Downloads\The_Subtleties_of_the_Inimitable_Mulla_Nasrudin.pdf|2",
    "Shadows and Light|Michael Smith|https://images.unsplash.com/photo-1512820790803-83ca734da794|C:\Users\Aditya Deshmukh\Downloads\The_Subtleties_of_the_Inimitable_Mulla_Nasrudin.pdf|3",
    "Beyond the Horizon|Sarah Williams|https://images.unsplash.com/photo-1471102204083-6b71e6e67c5f|C:\Users\Aditya Deshmukh\Downloads\The_Subtleties_of_the_Inimitable_Mulla_Nasrudin.pdf|1",
    "The Forgotten Path|Daniel Johnson|https://images.unsplash.com/photo-1455885666463-9f75d2fe0c98|C:\Users\Aditya Deshmukh\Downloads\The_Subtleties_of_the_Inimitable_Mulla_Nasrudin.pdf|2"
)

foreach ($book in $books) {
    $parts = $book -split '\|'
    $title = $parts[0]
    $author = $parts[1]
    $image = $parts[2]
    $pdf = $parts[3]
    $genre = $parts[4]

    Write-Host "Uploading: $title by $author"

    curl.exe -X POST "http://freeelib.runasp.net/api/Books/bookupload" `
        -H "accept: */*" `
        -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9lbWFpbGFkZHJlc3MiOiJEZXNobXVraEBnbWFpbC5jb20iLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiRGVzaG11a2hAZ21haWwuY29tIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZWlkZW50aWZpZXIiOiJkMTU1YTk5MS0xMDVkLTQ5NTEtYWMxNi1mNTkzODQxMjE5ZjciLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJVc2VyIiwiZXhwIjoxNzU1MTU5NzM4LCJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo3Mjg3LyIsImF1ZCI6Imh0dHBzOi8vbG9jYWxob3N0OjcyODcvIn0.R9fHyNDbfszfB0UcggpS-NgyiM7N4duWqZw8-GBcmNQ' `
        -H "Content-Type: multipart/form-data" `
        -F "Title=$title" `
        -F "Author=$author" `
        -F "Rating=4.0" `
        -F "Description=Sample description for $title" `
        -F "Image=$image" `
        -F "PdfUrl=$pdf" `
        -F "GenreIds=$genre"
}
