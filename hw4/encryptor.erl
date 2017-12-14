%Кодировка: для сингего цвета бронируем для кодирования текста 4 младших бита,
%для всех остальных -- по 2
%Один байт текста кодируется в один пикесель.
% 64 пустых служебный бита в заголовке использованы под число занятых текстом байт.

-module(encryptor).
-import(bmp_image,[load/2,get_size/1,get_pixel/2, construct_image/1]).
-import(bitmask,[get_subarray_from_bitarray/1]).
-import(bitmask,[get_subarray_from_bitarray/2]).
-export([encoder/1, decoder/1]).
-include("image_rec.hrl").
-import(math, [pow/2]).


recover_number_from_bit_mask([])->
    0;
recover_number_from_bit_mask([F | Other]) ->
    round(pow(2, 8-F))+recover_number_from_bit_mask(Other).


clear_bits(N, BitsToClear) ->
    Result = N-recover_number_from_bit_mask(BitsToClear),
    Result.

round_nbytes(ListOffset, N) ->
    case length(ListOffset) < N of
        true -> round_nbytes([<<0>>]++ListOffset, 4);
        false -> ListOffset
    end.

cut_bad_byte(Text) ->
    LastByte = binary_part(Text, byte_size(Text)-1, 1),
    LastBits = hd(tl(bitmask:get_subarray_from_bitarray(LastByte))),
    case LastBits of
        [0 | _] -> Text;
        [1, 1| _] -> binary_part(Text, 0, byte_size(Text)-1);
        [1, 0 | _] -> cut_bad_byte(binary_part(Text, 0, byte_size(Text)-1))
    end.

cut_text(Text, Image) ->
    case 3*bit_size(Text) < bit_size(Image#image.contents) of
        false -> 
            MaxText = binary_part(Text, 0, round(byte_size(Image#image.contents)/3)),
            cut_bad_byte(MaxText);
        true -> Text
    end.


insert(InputText, Image) ->
    Text = cut_text(InputText, Image),
    TextBitsList = hd(tl(get_subarray_from_bitarray(Text))),
    <<"BM", Size:32/bits, _:32, Hdr/binary>> = Image#image.headers, 
    Offset = binary:encode_unsigned(round(length(TextBitsList)/8)*3),
    L = length(binary_to_list(Offset)),
    case L < 4 of
        true ->
            Offset32= round_nbytes(binary_to_list(Offset), 4),
            NewHeader = list_to_binary([<<"BM">>, Size, Offset32, Hdr]), 
            ImageByteList = binary_to_list(Image#image.contents), 
            list_to_binary([NewHeader , insert_bits(TextBitsList, ImageByteList, [])]);
        false ->
            unreal_long_text
    end.


insert_bits([], Image, NewImageByteList) ->
    NewImageByteList++Image;
insert_bits(_Text, [], NewImageByteList) ->
    NewImageByteList;
insert_bits([B1, B2, B3, B4, B5, B6, B7, B8 | TextTail], [B, G, R | ImageTail], NewImageByteList) ->
    ClearB = clear_bits(B, hd(get_subarray_from_bitarray(<<B>>, [8,7,6,5]))),
    ClearG = clear_bits(G, hd(get_subarray_from_bitarray(<<G>>, [8,7]))),
    ClearR = clear_bits(R, hd(get_subarray_from_bitarray(<<R>>, [8,7]))),
    NewB = ClearB + B1 * 2*2*2 + B2*2*2 + B3*2 + B4,
    NewG = ClearG + B5*2 + B6,
    NewR = ClearR + B7*2 + B8,
    insert_bits(TextTail, ImageTail, NewImageByteList++[NewB]++[NewG]++[NewR]).


eject(Image) ->
    <<"BM", _:32, TextByteLength:32, _Off:32/little, _Hdr/binary>> = Image#image.headers, 
    ImageWithText=binary_to_list(binary_part(Image#image.contents, 0, TextByteLength)),
    eject_bits(ImageWithText, []).


eject_bits([], Text) ->
    list_to_binary(Text);
eject_bits([B, G, R | ImageTail], Text) ->
    ClearB = clear_bits(B, hd(get_subarray_from_bitarray(<<B>>, [8,7,6,5]))),
    ClearG = clear_bits(G, hd(get_subarray_from_bitarray(<<G>>, [8,7]))),
    ClearR = clear_bits(R, hd(get_subarray_from_bitarray(<<R>>, [8,7]))),
    DifB = B-ClearB,
    DifG = G-ClearG,
    DifR = R-ClearR,
    Char = DifR + DifG*4+DifB*16,
    eject_bits(ImageTail, Text++[Char]).


encoder([FileNameImage, FileNameText]) ->
    encoder([FileNameImage, FileNameText, "image_with_text.bmp"]);
encoder([FileNameImage, FileNameText, NewFileName]) -> 
    {ok, Image} = bmp_image:load(bmp, FileNameImage),
    {ok, Text} = file:read_file(FileNameText),
    NewImage = insert(Text, Image),
    file:write_file(NewFileName,  NewImage).

decoder(FileName) ->
    {ok, Image} = bmp_image:load(bmp, FileName),
    Text = eject(Image),
    file:write_file("eject_text",  Text).
