function benchmark () {
    var n = 100000;
    var startTime = getTime();

    var i;
    console.log("ready");

    for (i = 0; i < n; i++) {
        validiQ("email || blank")("asdaw");
    }

    console.log(n * 1000 / (getTime() - startTime)) ;
}

function getTime () {
    return (new Date()).getTime();
}