# Dummy book data: Title | Author | Image URL | PDF URL | GenreId
$books = @(
    # New entries
    "City of Dreams|Anna Martinez|https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|2|English",
    "Silent Echo|Mark Johnson|https://picsum.photos/id/1020/800/600|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|1|English",
    "Golden Horizon|Isabella Clark|https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|3|English",
    "Frozen Waves|David Brown|https://picsum.photos/id/1011/800/600|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|2|English",
    "The Burning Sky|Charlotte Lee|https://images.unsplash.com/photo-1536323760109-ca8c07450053?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|1|Hindi",
    "Fragments of Time|Henry Wilson|https://picsum.photos/id/1012/800/600|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|3|English",
    "Into the Mist|Grace Evans|https://images.unsplash.com/photo-1465146633011-14f18c72b735?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|2|English",
    "The Hidden Truth|William Scott|https://picsum.photos/id/1006/800/600|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|1|English",
    "Silver Moon|Amelia King|https://images.unsplash.com/photo-1519682337058-a94d519337bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|3|English",
    "Journey North|Ethan Wright|https://picsum.photos/id/1019/800/600|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|1|English",
    "Ocean Whispers|Sophia Turner|https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|2|English",
    "The Final Note|Lucas Moore|https://picsum.photos/id/1004/800/600|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|3|English",
    "Dust and Stars|Harper Adams|https://images.unsplash.com/photo-1499084732479-de2c02d45fc4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|1|Hindi",
    "The Painted Veil|Mia Nelson|https://picsum.photos/id/1018/800/600|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|2|English",
    "Broken Wings|Benjamin Roberts|https://images.unsplash.com/photo-1492724441997-5dc865305da7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|1|English",
    "Light and Shadow|Ella Reed|https://picsum.photos/id/1017/800/600|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|3|English",
    "Falling Stars|Jack Hughes|https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|1|English",
    "Under the Canopy|Chloe Morgan|https://picsum.photos/id/1021/800/600|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|2|English",
    "Burning Bridges|Logan Bailey|https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80|C:\Users\Aditya Deshmukh\Downloads\Sample.pdf|3|English"
)

foreach ($book in $books) {
    $parts = $book -split '\|'
    $title = $parts[0]
    $author = $parts[1]
    $image = $parts[2]
    $pdf = $parts[3]
    $genre = $parts[4]
    $language = $parts[5]

    Write-Host "Uploading: $title by $author"

    curl.exe -X POST "http://freeelib.runasp.net/api/Books/bookupload" `
        -H "accept: */*" `
        -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9lbWFpbGFkZHJlc3MiOiJEZXNobXVraEBnbWFpbC5jb20iLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1lIjoiRGVzaG11a2hAZ21haWwuY29tIiwiaHR0cDovL3NjaGVtYXMueG1sc29hcC5vcmcvd3MvMjAwNS8wNS9pZGVudGl0eS9jbGFpbXMvbmFtZWlkZW50aWZpZXIiOiIxODU1YzNhMy05ZWY3LTRlMjQtYTdkZC1hODlkYzQ4NTE2N2IiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJVc2VyIiwiZXhwIjoxNzU3NzY1ODE0LCJpc3MiOiJodHRwczovL2xvY2FsaG9zdDo3Mjg3LyIsImF1ZCI6Imh0dHBzOi8vbG9jYWxob3N0OjcyODcvIn0.vwUaJX5hKt7v3tHEF90K-wSUt_hHpUkEZm5mvZhwn2U' `
        -H "Content-Type: multipart/form-data" `
        -F "Title=$title" `
        -F "Author=$author" `
        -F "Rating=4.0" `
        -F "Description=Sample description for $title" `
        -F "Image=$image" `
        -F "PdfUrl=$pdf" `
        -F "GenreIds=$genre" `
        -F "Language=$language"    `
}
