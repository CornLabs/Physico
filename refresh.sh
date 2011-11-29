#!/bin/bash


scriptname=$(readlink "$0")
base="$(cd -P "$(dirname "$scriptname")" && pwd)" 
files=$(ls $base/tracks)
json="Physico.musicPlayer.tracks={'tracks':{"
no=0
for file in $files
do
	if [ "$file" != "list.js" ] 
	then
		json=$json"'"$no"': '"$file"', "
		no=$((no+1))
	fi
done
json=$json"}, number:"$no"}"
echo $json > $base/tracks/list.js