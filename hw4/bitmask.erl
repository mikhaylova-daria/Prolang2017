-module(bitmask).
-export([get_subarray_from_bitarray/2]).
-export([get_subarray_from_bitarray/1]).


get_subarray_from_bitarray(Bitstring) ->
  get_subarray_from_bitarray(Bitstring, lists:seq(1, 8*length(binary_to_list(Bitstring)))).

get_subarray_from_bitarray(Bitstring, List) ->
  get_subarray_from_bitarray_loop(Bitstring, List, [], []).

get_subarray_from_bitarray_loop(_Bits, [], Gathered, Bits) ->
  %io:format("End of list~n", []),
  [lists:reverse(Gathered), Bits];
get_subarray_from_bitarray_loop(<<>>, _Others, Gathered, Bits) ->
  %io:format("End of bitstring~n", []),
  [lists:reverse(Gathered), Bits];
get_subarray_from_bitarray_loop(<<Rest/bitstring>>, [Item | Others], Gathered, Bits) ->
  HeadSize = Item-1,
  <<_Head:HeadSize, Bit:1, _Tail/bitstring >> = Rest,
  %io:format("Bit: ~w ~n", [Bit]),
  case Bit of
    1 -> get_subarray_from_bitarray_loop(Rest, Others, [Item | Gathered], Bits++[1]);
    0 -> get_subarray_from_bitarray_loop(Rest, Others, Gathered, Bits++[0])
  end.

