function filmExtractor() {
    var scripts = document.querySelectorAll("script");
    var jsonResult = "{}";
    let value;
    for (let i = 0; i < scripts.length; i++) {
        value = scripts[i];
        var indexStart = value.innerHTML.search("window.__player__");
        if (indexStart > -1) {
            var windowPlayer = value.innerHTML.substr(indexStart);
            jsonResult = windowPlayer.replace(new RegExp("(window.__player__)(.*)(\{.*?})(.*)", 'gs'), "$3");
            break;
        }
    }
    jsonResult = jsonResult.replaceAll(new RegExp("( )(\\w+)(:)", 'gis'), "\"$2\"$3");
    jsonResult = jsonResult.replaceAll(new RegExp("'", 'gis'), "\"");

    let parsedJSON = JSON.parse(jsonResult);
    parsedJSON["subs_exist_en"] = value.innerHTML.substr(value.innerHTML.search("(var enSubExist = )(0|1)(;)") + 17, 1) === '1';
    parsedJSON["subs_exist_ru"] = value.innerHTML.substr(value.innerHTML.search("(var ruSubExist = )(0|1)(;)") + 17, 1) === '1';


    indexStart = value.innerHTML.search("window.SUBTITLES");
    let subTitles = value.innerHTML.substr(indexStart);
    jsonResult = subTitles.replace(new RegExp("(window.SUBTITLES)(.*?)(\\[.*?])(;.*)", 'gs'), "$3");
    parsedJSON["subtitles"]=JSON.parse(jsonResult);

    return parsedJSON;
}

function serialInfoExtractor() {
    var scripts = document.querySelectorAll("script");
    var jsonResult = "{}";
    for (let i = 0; i < scripts.length; i++) {
        let value = scripts[i];
        var serialInfoIndexStart = value.innerHTML.search("var serialInfo");
        if (serialInfoIndexStart > -1) {
            var subString = value.innerHTML.substr(serialInfoIndexStart);
            jsonResult = subString.replace(new RegExp("(.*)(var serialInfo)(.*?)(\{.*\})(;.*)", 'gs'), "$4");
            break;
        }
    }
    return JSON.parse(jsonResult);
}
//
// function episodeExtractor() {
//     var scripts = document.querySelectorAll("script");
//     var jsonResult = "{}";
//     for (let i = 0; i < scripts.length; i++) {
//         let value = scripts[i];
//         var episodesIndexStart = value.innerHTML.search("var episodes");
//         if (episodesIndexStart > -1) {
//             var subString = value.innerHTML.substr(episodesIndexStart);
//             jsonResult = subString.replace(new RegExp("(var episodes)(.*?)(\[.*?\])(;)(.*var.*)", 'gs'), "$3");
//             break;
//         }
//     }
//     return JSON.parse(jsonResult);
// }

function downloadButton(id, url, isEnSubtitle = false, isRuSubtitle = false, jsonSubtitles) {
    var styles = `
    .download {
        margin-left: 10px
    }
    .download`+id+`> 
    audio::-webkit-media-controls-timeline,
    video::-webkit-media-controls-timeline,
    video::-webkit-media-controls-play-button,
    video::-webkit-media-controls-volume-slider,
    video::-webkit-media-controls-current-time-display,
    video::-webkit-media-controls-time-remaining-display,
    video::-webkit-media-controls-fullscreen-button,
    video::-webkit-media-controls-volume-slider,
    video::-webkit-media-controls-mute-button
    {
            display: none;
    }
    `
    var styleSheet = document.createElement("style")
    styleSheet.type = "text/css"
    styleSheet.innerText = styles
    document.head.appendChild(styleSheet)

    var pageUrl = document.URL;
    var index = pageUrl.lastIndexOf("#");
    var subStringIndex = index === -1 ? 32 : index + 1

    let subTitleButtons = "";

    if (isRuSubtitle) {
        subTitleButtons += `<span class="puzzle_va_middle puzzle_ml_10"><a href="data:text/plain;charset=utf-8,`
            + encodeURIComponent(buildSubTitles("ru", jsonSubtitles))
            + `" download="` + pageUrl.substr(subStringIndex) + '.Subtitle.ru.vtt' + `">sub-RU</a></span>`
    }
    if (isEnSubtitle) {
        subTitleButtons += `<span class="puzzle_va_middle puzzle_ml_10"><a href="data:text/plain;charset=utf-8,`
            + encodeURIComponent(buildSubTitles("en", jsonSubtitles))
            + `" download="` + pageUrl.substr(subStringIndex) + '.Subtitle.en.vtt' + `">sub-EN</a></span>`
    }


    return `
    <div class="download` + id + `">
       <span class="movies-button movies-button_bg-gray movies-button_pt-0_pb_0">
         <span class="movies-button-inset movies-button_h40">
             <video width="15" height="50" controls="false" muted disablePictureInPicture>
                <source src="` + url + `" type="video/mp4">
            </video>
             ` + subTitleButtons + `
         </span>
       </span>
    </div>`;
}

function buildSubTitles(type, jsonSubtitles) {
    var text = "WEBVTT\n";
    for (let i = 0; i < jsonSubtitles.length; i++) {
        text += (i + 1);
        text += "\n";
        text += jsonSubtitles[i].start.subTitleTime() + " --> " + jsonSubtitles[i].finish.subTitleTime();
        text += "\n";
        switch (type) {
            case "ru":
                text += jsonSubtitles[i].ru;
                break;
            case "en":
                text += jsonSubtitles[i].en;
                break;
            default:
                console.error("Unsupported type");
        }
        text += "\n\n";
    }
    return text;
}

Number.prototype.subTitleTime = function () {
    var date = new Date(this * 1_000);
    return date.toISOString().substr(11, 12)
}

if (document.URL.startsWith("https://puzzle-movies.com/films")) {
    console.log("film started");
    const jsonFilm = filmExtractor();
    const element = document.querySelector(".series-films__info-user-elem.js-series-films-info-user-elem");
    if (element != null && element.querySelector(".download") == null) {
        element.innerHTML += downloadButton("", jsonFilm.url, jsonFilm.subs_exist_en, jsonFilm.subs_exist_ru, jsonFilm.subtitles);
    }
    console.log("film finished");
} else if (document.URL.match("(.*?)(s\\d+e\\d+)(.*)")) {

    var serialJsonInfo = serialInfoExtractor();

    var season = document.URL.replace(new RegExp("(.*?)(s)(\\d+)(e)(\\d+)(.*)", 'gs'), "$3");
    var episode = document.URL.replace(new RegExp("(.*?)(s)(\\d+)(e)(\\d+)(.*)", 'gs'), "$5") - 1;

    const elements = document.querySelectorAll(".series-light__table-row");
    if (elements != null && elements[episode].querySelector(".downloads" + season + "e" + episode) == null) {
        fetch("api2/movies/getEpisodeData?movieID=" +
            serialJsonInfo.movie_id + "&slug=" + serialJsonInfo.slug + "&postID=" + serialJsonInfo.seasons[season].episodes[episode].ID)
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                elements[episode].innerHTML += downloadButton("s" + season + "e" + episode, data.videoURL,
                    data.subs_exist_en, data.subs_exist_ru, data.subtitles);
            }).catch(reason => console.error(reason));
    }
}