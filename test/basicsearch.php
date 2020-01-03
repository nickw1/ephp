<!DOCTYPE html>
<html>
    <head>
        <title>Basic search</title>
    </head>
    <body>
<?php

$conn = new PDO("mysql:host=localhost;dbname=ephp001;", "ephp001", "password");
$a = $_GET["artist"];

$result = $conn->query("SELECT * FROM songs WHERE artist='$a'");
while($row = $result->fetch()) {
    echo "<p>";
    echo "Title: $row[title]<br />";
    echo "Artist: $row[artist]<br />";
    echo "Year: $row[year]<br />";
    echo "</p>";
}
?>
    </body>
</html>
