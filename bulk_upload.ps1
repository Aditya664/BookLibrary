# Dummy book data: Title | Author | Image URL | PDF URL | GenreId
$books = @(
    "The Silent Forest|John Green|https://images.unsplash.com/photo-1529655683826-aba9b3e77383|https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf|1",
    "Waves of Time|Emily Carter|https://images.unsplash.com/photo-1507842217343-583bb7270b66|https://www.orimi.com/pdf-test.pdf|2",
    "Shadows and Light|Michael Smith|https://images.unsplash.com/photo-1512820790803-83ca734da794|https://file-examples.com/storage/fe1e4f9f7a20ecedb9c2f19/2017/10/file-example_PDF_500_kB.pdf|3",
    "Beyond the Horizon|Sarah Williams|https://images.unsplash.com/photo-1471102204083-6b71e6e67c5f|https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf|1",
    "The Forgotten Path|Daniel Johnson|https://images.unsplash.com/photo-1455885666463-9f75d2fe0c98|https://www.hq.nasa.gov/alsj/a17/A17_FlightPlan.pdf|2"
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
        -H "Content-Type: multipart/form-data" `
        -F "Title=$title" `
        -F "Author=$author" `
        -F "Rating=4.0" `
        -F "Description=Sample description for $title" `
        -F "Image=$image" `
        -F "PdfUrl=$pdf" `
        -F "GenreIds=$genre"
}
