#!/usr/bin/python

import re
import subprocess
import string

#Note pdftotext must be present in the OS path
#Windows and mac downloads are here: https://www.xpdfreader.com/
#Included in many linux distros by default, or else see your package manager.

#Create index for the book
#There must be a file called terms.txt in the same dir as this python file.
#The first two lines specify the PDF file and page range to index, for example:
#PDF FILE example.pdf
#INDEX PAGES 11 to 299

#Each subsequent line specifies one entry for the index. Examples are.
#To list GDP in the index just put that on a line by itself
#GDP
#To list GDP in the index but also include pages with gross domestic product
#GDP|gross domestic production
#Note that caps are ignored but spaces are note
#To match plurals do this
#hill|PLURAL
#It will respect the word ending eg bus plural is buses, country is countries
#You can specify the plural manually of course when this is not the case
#cactus|cacti
#Instead of an index term show a list of pages it can reference another term
#spending|see expenditure
#will show an index entry as: spending see expenditure

#terms={"mission":[],"gdp":[],"gross domestic product":[]}

plurals=set()

def getPlural(word):
  plural=word+"s"
  if word[-1]=='s':
    plural=word+"es"
  elif word[-1]=='y':
    plural=word[:-1]+"ies"

  global plurals
  plurals.add(plural)
  return plural

def isPresent(text,term):
    if "|see " in term:
      return False
    termList=term.split('|')
    lastTerm="-xNONEx-"
    for t in termList:
      if t=='PLURAL':
	search=" "+getPlural(lastTerm.lower())+" "
      else:
	search=" "+t.lower()+" "
      if search in contents:
	return True
      lastTerm=t

terms={}



file = open('terms.txt', 'r')

line=file.readline().rstrip()
ss=line.split(' ')
filename=ss[2]

line=file.readline().rstrip()
ss=line.split(' ')
pageStart=int(ss[2])
pageEnd=int(ss[4])

line=file.readline()
while line:
  sline=line.rstrip()
  terms[sline]=[]
  line=file.readline() 

file.close()

#Note range must extend one page beyond the page where search is to end
for page in range(pageStart, pageEnd):
  spage=str(page)
  #to lower case and remove non-alphanumeric characters
  contents=subprocess.check_output(['pdftotext','-eol','unix','-f',spage,'-l',spage,filename,'-']).lower()
  contents=contents.replace("\n"," ")
  contents=contents.replace("\r"," ")
  contents = re.sub("[^a-zA-Z \n\r]","", contents)
  #Removes non printable chars, but doesn't seem to be necessary
  #contents = filter(lambda x: x in string.printable, contents)
  #remove multiple spaces
  contents = re.sub(" +"," ", contents)
  #print contents
  for term, index in terms.iteritems():
    if isPresent(contents,term):
      index.append(page)
      
#print terms
#print sorted(plurals)
 
skeys=sorted(terms.keys(), key=lambda v: v.upper())
for key in skeys:
  s=key.split('|')[0]+" "
  if "|see " in key:
    s=s+key.split('|')[1]
  else:
    index=terms[key]
    last=-100
    isDash=False
    for i in index:
      if isDash:
	if i!=(last+1):
	  s=s+"-"+str(last)
	  isDash=False
	  
      isDash= i==(last+1)
      if isDash==False:
	if i!=index[0]:
	  s=s+","
	s=s+str(i)
      last=i
  print s
