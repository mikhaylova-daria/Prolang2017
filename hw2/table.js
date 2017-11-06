
var header=[];
for (var i = 65; i <= 90; i++) {
    header.push(String.fromCharCode(i));
}
var N=20;
var expr = {};
for (var i = 65; i <= 90; i++) {
    for (var j=1; j <= N; j++) {
        expr[String.fromCharCode(i)+j] = null;
    }
}
var etable;
var new_table = function() {
        etable = "<div class='Table1'> <table border='1' cellpadding='0' cellspacing='0' width='100%'>";
        etable += "<th></th>"

        for(var i=0; i<header.length; i++) {
            etable += "<th>"+header[i]+"</th>";
        }
        etable += '</thead>'
        etable +="<tbody align='center'>";
        for(var k=0; k<N; k++) {
            etable += "<tr><td width='3.5%'>"+(k+1)+"</td><td width='3.5%'>".repeat(header.length)+ "</td></tr>";
        }
        etable += "</tbody>";
        etable += "</table></div>";
        return etable;
}

var init = function() {
    if (localStorage.length === 0) {
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
        ind = header[col-1]+row;
        //по клику в инпуте показываем формулу, в ячейке без фокуса -- значение
        var val = (expr[ind]!==undefined?expr[ind]:$(this).val());
        var code = '<input type="text" id="edit" value="'+val+'" />';
        $(this).empty().append(code);
        $('#edit').focus();
        $('#edit').blur(function()	{
            expr[ind] = $(this).val();
            //формула обязана начинаться с =, все остальное -- просто текст
            if  (expr[ind][0]==='=') {
                var a = expr[ind].substr(1, expr[ind].length);
                try {
                    a = parse(a);
                } catch (e) {
                    a = 'ERROR';
                }
                $(this).parent().empty().html(a);

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
    });
    $("#save").click(function () {
       setSettings();
    });

    $("#clear").click(function () {
       clearSettings();
       location.reload();
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



var filterFloat = function (value) {
    if(/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/
      .test(value))
      return Number(value);
  return NaN;
}

// Набор допустимых операций
var ops = {
   '+'  : {op: '+', precedence: 10, assoc: 'L', exec: function(l,r) { return l+r; } },
   '-'  : {op: '-', precedence: 10, assoc: 'L', exec: function(l,r) { return l-r; } },
   '*'  : {op: '*', precedence: 20, assoc: 'L', exec: function(l,r) { return l*r; } },
   '/'  : {op: '/', precedence: 20, assoc: 'L', exec: function(l,r) { return l/r; } },
};


// input for parsing: var r = { string: '123.45+33*8', offset: 0 };
// r is passed by reference: any change in r.offset is returned to the caller
// functions return the parsed/calculated value
function parseVal(r) {
    var startOffset = r.offset;
    var value;
    var m;
    // разбор чисел с плавающей точкой
    value = 0;
    while("0123456789".indexOf(r.string.substr(r.offset, 1)) >= 0 && r.offset < r.string.length) r.offset++;
    if(r.string.substr(r.offset, 1) == ".") {
        r.offset++;
        while("0123456789".indexOf(r.string.substr(r.offset, 1)) >= 0 && r.offset < r.string.length) r.offset++;
    }
    if(r.offset > startOffset) {
        return filterFloat(r.string.substr(startOffset, r.offset-startOffset));
    } else if(r.string.substr(r.offset, 1) == "+"
              && (r.offset==0 || r.string.substr(r.offset-1, 1) == "(")) { //унарный плюс
        r.offset++;
        return parseVal(r);
    } else if(r.string.substr(r.offset, 1) == "-"
              && (r.offset==0 ||r.string.substr(r.offset-1, 1) == "(")) { //унарный минус
        r.offset++;
        return negate(parseVal(r));
    } else if(r.string.substr(r.offset, 1) == "(") {
        r.offset++;   // считали "("
        value = parseExpr(r);
        if(r.string.substr(r.offset, 1) == ")") {
            r.offset++; //считали ")"
            return value; //вернули значение между скобками
        }
        r.error = "Ошибка: пропущена ')'";
        throw 'parseError';
    } else if(m = /^[a-z][a-z0-9_]*/i.exec(r.string.substr(r.offset))) {  // названия ячеек
        var name = m[0];
        r.offset += name.length;
        if (name in expr) {
            if (expr[name] == null) {
                return 0;
            }
            if  (expr[name][0]==='=') {
                var a = expr[name].substr(1, expr[name].length);
                return parse(a);
            } else {
                if (expr[name]!=null) {
                    if (!isNaN(filterFloat(expr[name]))) {
                       return filterFloat(expr[name]);
                    } else {
                        r.error = "Ошибка: нечисловое выражение в ячейке " + name;
                        throw 'unknownVar';
                    }
                } else {
                    return 0;
                }
            }
        }
        else {
            r.error = "Ошибка: неизвестная переменная '" + name + "'";
            throw 'unknownVar';
        }
    } else {
        if(r.string.length == r.offset) {
            r.error = 'Оошибка: неожиданный конец строки';
            throw 'valueMissing';
        } else  {
            r.error = "Ошибка: невалидное выражение";
            throw 'valueNotParsed';
        }
    }
}

function negate (value) {
    return -value;
}

function parseOp(r) {
    if("+-*/".indexOf(r.string.substr(r.offset,1)) >= 0)
        return ops[r.string.substr(r.offset++, 1)];
    return null;
}

function parseExpr(r) {
    var stack = [{precedence: 0, assoc: 'L'}];
    var op;
    var value = parseVal(r); //вычисляем самое первое выражение слева
    for(;;){
        try {
            op = parseOp(r) || {precedence: 0, assoc: 'L'};
        } catch (exception_var) {
            throw exception_var;
        }

        while(op.precedence < stack[stack.length-1].precedence ||
              (op.precedence == stack[stack.length-1].precedence && op.assoc == 'L')) {
            // вычисляем выражение слева
            var tos = stack.pop();
            if(!tos.exec) return value;
            value = tos.exec(tos.value, value);
        }
        //shift: складываем в стек операцию
        stack.push({op: op.op, precedence: op.precedence, assoc: op.assoc, exec: op.exec, value: value});
        value = parseVal(r);  // вычисляем выражение справа
    }
}

function parse (string) {
    var r = {string: string, offset: 0};
    try {
        var value = parseExpr(r);
        if(r.offset < r.string.length){
          r.error = 'Ошибка в позиции ' + r.offset;
            throw 'trailingJunk';
        }
        return value;
    } catch(e) {
        alert(r.error + ' (' + e + '):\n' + r.string.substr(0, r.offset) + r.string.substr(r.offset));
        throw e;
    }
    return;
}

