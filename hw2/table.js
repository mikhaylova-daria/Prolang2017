var header=[];

for (var i = 65; i <= 90; i++) {
    header.push(String.fromCharCode(i));
}
var N=20;
var expr = {};

var output = function() {
var myTable = "<div class='Table1'> <table border='1' cellpadding='0' cellspacing='0' width='100%'>";
myTable += "<th></th>"
for(var i=0; i<header.length; i++)
{myTable += "<th>"+header[i]+"</th>";
}
myTable += '</thead>'
myTable +="<tbody align='center'>";
for(var i=0; i<N; i++)
{myTable += "<tr><td width='3.5%'>"+(i+1)+"</td><td width='3.5%'>".repeat(header.length)+ "</td></tr>";
}
myTable += "</tbody>";
myTable += "</table></div>";
document.getElementById("etable").innerHTML = myTable;
}
output();

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
    });
});

$(window).keydown(function(event){
    //ловим событие нажатия клавиши
    if(event.keyCode === 13) {	//если это Enter
        $('#edit').blur();	//снимаем фокус с поля ввода
    }
});


