#!/bin/bash

#Set according to whether greyscale or colour
ISCOLOUR=0

#SRC must point to where chapter?_images dirs are as appropritate to ISCOLOUR
#DEST must point to a dir containing a colour or bw dir as appropritate to ISCOLOUR

#SRC=/home/nalu/Downloads/howscotlandworks


if [ $ISCOLOUR -eq 1 ]
then
  DEST=$DEST/colour
  BW=""
else
  DEST=$DEST/bw
  BW="_bw"
fi

CONV="convert -pointsize 20 -fill black -draw 'text 1270,40 \"howscotlandworks.org\" text 1270,70 \"© 2018  @mcnalu\"'"

cd $SRC

for chapdir in chapter?_images
do
  echo $chapdir
  mkdir -p $DEST/$chapdir
  for fullpath in $chapdir/*
  do
    fname=$(basename $fullpath)
    echo $fullpath $DEST/$chapdir/$fname
    convert -pointsize 20 -fill black -draw 'text 1270,40 "howscotlandworks.org" text 1270,70 "© 2018  @mcnalu"' $fullpath $DEST/$chapdir/$fname
  done
done

#Now replace the ones where the copyright message is wrong or misplaced.

FPATH=chapter1_images/figure_1.1_scot_population_sex_nrs$BW.png
convert -pointsize 20 -fill black -draw 'text 20,20 "National Records of Scotland, Open Government License"' $FPATH $DEST/$FPATH

FPATH=chapter1_images/figure_1.2_scot_population_change_nrs$BW.png
convert -pointsize 20 -fill black -draw 'text 20,20 "National Records of Scotland, Open Government License"' $FPATH $DEST/$FPATH

FPATH=chapter2_images/figure_2.2_energy_flow_chart_simple$BW.png
convert -pointsize 20 -fill black -draw 'text 1270,820 "howscotlandworks.org" text 1270,850 "© 2018  @mcnalu"' $FPATH $DEST/$FPATH

FPATH=chapter2_images/figure_2.6_electricity_scotland_demand$BW.png
convert -pointsize 20 -fill black -draw 'text 1100,600 "howscotlandworks.org" text 1100,630 "© 2018  @mcnalu"' $FPATH $DEST/$FPATH

FPATH=chapter2_images/figure_2.7_electricity_hourly_demand$BW.png
convert -pointsize 20 -fill black -draw 'text 1130,50 "howscotlandworks.org" text 1130,80 "© 2018  @mcnalu"' $FPATH $DEST/$FPATH

FPATH=chapter2_images/figure_2.9_transport_modes_people.png
convert -pointsize 20 -fill black -draw 'text 550,30 "Transport Scotland, Open Government License"' $FPATH $DEST/$FPATH

FPATH=chapter5_images/figure_5.15_gers_devolved_powers$BW.png
convert -pointsize 20 -fill black -draw 'text 10,80 "howscotlandworks.org" text 10,110 "© 2018  @mcnalu"' $FPATH $DEST/$FPATH

FPATH=chapter6_images/figure_6.17_imports_exports_gdp$BW.png
convert -pointsize 20 -fill black -draw 'text 1450,40 "howscotlandworks.org" text 1450,70 "© 2018  @mcnalu"' $FPATH $DEST/$FPATH

FPATH=chapter6_images/figure_6.21_sectoral_balances$BW.png
convert -pointsize 20 -fill black -draw 'text 1100,40 "howscotlandworks.org" text 1100,70 "© 2018  @mcnalu"' $FPATH $DEST/$FPATH