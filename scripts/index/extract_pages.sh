#!/bin/bash

mkdir -p pages

PDF=/path/to/file.pdf

#Set start and last page number in for line
for p in `seq 1 304`;
do
	echo $p
        pdftotext -f $p -l $p $PDF pages/$p.txt
done