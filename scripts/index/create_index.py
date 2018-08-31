#!/usr/bin/python

import re

#Create index for the book

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

line=file.readline()
while line:
  sline=line.rstrip()
  terms[sline]=[]
  line=file.readline() 

file.close()

#Note range must extend one page beyond the page where search is to end
for page in range(11, 299):
#for page in range(43, 44):
  file = open('pages/'+str(page)+'.txt', 'r')
  #to lower case and remove non-alphanumeric characters
  contents = re.sub("[^a-zA-Z \n\r]","", file.read().lower()).replace("\n"," ")
  #contents=file.read().lower()
  #print contents
  for term, index in terms.iteritems():
    if isPresent(contents,term):
      index.append(page)
  file.close()

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