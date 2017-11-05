
var header=[];
for (var i = 65; i <= 90; i++) {
    header.push(String.fromCharCode(i));
}
var N=20;
var expr = {};
var etable;
var new_table = function() {
        etable = "<div class='Table1'> <table border='1' cellpadding='0' cellspacing='0' width='100%'>";
        etable += "<th></th>"

        for(var i=0; i<header.length; i++)
        {etable += "<th>"+header[i]+"</th>";
        }
        etable += '</thead>'
        etable +="<tbody align='center'>";
        for(var i=0; i<N; i++)
        {etable += "<tr><td width='3.5%'>"+(i+1)+"</td><td width='3.5%'>".repeat(header.length)+ "</td></tr>";
        }
        etable += "</tbody>";
        etable += "</table></div>";
        return etable;
}

var init = function() {
    if (localStorage.length == 0) {
        etable = new_table();
    } else {
        applySetting();
    }
    document.getElementById("etable").innerHTML = etable;
}

init();
var ind;

$(function()	{
    $("table tr td").click(function(e)	{
        //ловим элемент, по которому кликнули
        var t = e.target || e.srcElement;
        //получаем название тега
        var elm_name = t.tagName.toLowerCase();
        var row = this.parentNode.rowIndex;
        var col = this.cellIndex;
        //если это инпут - ничего не делаем
        if(elm_name ==='input')	{return false;}
        if(col === 0)	{return false;}
        //ind = row + header[col-1];
        var val = $(this).html();
        var code = '<input type="text" id="edit" value="'+val+'" />';
        $(this).empty().append(code);
        $('#edit').focus();
        $('#edit').blur(function()	{
            expr[ind] = $(this).val();

            //формула обязана начинаться с =, все остальное -- просто текст
            if  (expr[ind][0]==='=') {
                var a = expr[ind].substr(1, expr[ind].length);
                $(this).parent().empty().html(eval(a));
            } else {
                $(this).parent().empty().html(expr[ind]);
            }
        });
        $(window).keydown(function(event){
            //ловим событие нажатия клавиши
            if(event.keyCode === 13) {	//если это Enter
                $('#edit').blur();	//снимаем фокус с поля ввода
            }
        });

        $("#save").click(function () {
           setSettings();
        });

        $("#clear").click(function () {
           clearSettings();
           location.reload();
        });

    });
});


function applySetting() {
    if (localStorage.length != 0) {
        etable = JSON.parse(localStorage.getItem('etable'));
        expr = JSON.parse(localStorage.getItem('expressions'));
    }
}

function setSettings() {
    if ('localStorage' in window && window['localStorage'] != null) {
        try {
                localStorage.setItem('etable', JSON.stringify($("#etable").html()));
                localStorage.setItem('expressions', JSON.stringify(expr));
            } catch (e) {
                if (e == QUOTA_EXCEEDED_ERR) {
                    alert('Переполнение хранилища!');
                }
            }
    } else {
        alert('Данные не сохранятся, ваш браузер не поддерживает Local storage');
    }
}

function clearSettings() {
        localStorage.removeItem('etable');
        localStorage.removeItem('expressions');
}
