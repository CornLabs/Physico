#!/bin/bash


scriptname=$(readlink "$0")
if [ "$scriptname" == "" ]; then
	scriptname=$0
fi
base="$(cd -P "$(dirname "$scriptname")" && pwd)" 

crawlAndList()
{
files=$(ls "$base/$1")
json="$2={'files':{"
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
echo $json > $base/$1/list.js
}

crawlAndList "tracks" "GUI.musicPlayer.tracks"
crawlAndList "textures/clasicmode" "Physico.GL.textureSources"
crawlAndList "textures/trollmode" "Physico.GL.trolltextureSources"
