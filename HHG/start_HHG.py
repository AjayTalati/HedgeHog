#!/usr/bin/env python2.7


import sys
import gtk, gobject
from os import path, access, W_OK  # check: can we write to config file?
import subprocess
import time, datetime, os
from datetime import timedelta
import re
import hhg_dialogs.hhg_scan as hgd
import pdb

class timer:
	
	def calcStpTime(self, stpTime):
		stpTime_struc = datetime.datetime.now()+timedelta(days=365)
		stpTime.insert(0,stpTime_struc.year)
		stpTime.insert(1,stpTime_struc.month)
		stpTime.insert(2,stpTime_struc.day)

	def setTime(self, conf_file, stpTime):
		sysTime = datetime.datetime.now()
		
		if (stpTime[0]<sysTime.year) or \
			(stpTime[0]==sysTime.year and stpTime[1]<sysTime.month) or \
			(stpTime[0]==sysTime.year and stpTime[1]==sysTime.month and \
			stpTime[2]<sysTime.day):
			self.calcStpTime(stpTime)
		with open (conf_file, "r+w") as confhhg: 
			confhhg.seek(60,0)  # Write System Time
			confhhg.write(chr(sysTime.year-2000))
			confhhg.write(chr(0))
			confhhg.write(chr(sysTime.day))
			confhhg.write(chr(sysTime.month))
			confhhg.write(chr(sysTime.hour))
			confhhg.write(chr(0))
			confhhg.write(chr(sysTime.second))
			confhhg.write(chr(sysTime.minute))
			confhhg.seek(71,0)  # Write Stop Time
			confhhg.write(chr(stpTime[0]-2000))
			confhhg.write(chr(0))
			confhhg.write(chr(stpTime[2]))
			confhhg.write(chr(stpTime[1])) # Month
			confhhg.write(chr(sysTime.hour))
			confhhg.write(chr(0))
			confhhg.write(chr(sysTime.second))
			confhhg.write(chr(sysTime.minute))
			confhhg.close()

class start_HHG_dialog:

	def __init__( self ):
		self.timer = timer();   
		self.builder = gtk.Builder()
		self.homeDir = os.environ['HOME']
		try:
			self.builder.add_from_file(self.homeDir+"/.hgg/start.ui")
		except:
			self.builder.add_from_file("start.ui")
		self.logger = self.builder.get_object("Logger")
		self.cal = self.builder.get_object("Cal")
		dic = {
			"on_Logger_destroy" : self.Quit,
			"on_StartButton_clicked": self.StartLogging,
			"on_Cal_day_selected": self.CalDayClick,
		}
		self.builder.connect_signals(dic)
		self.logger.show_all()
		self.conf_file = config_file
		self.stpTime = []
		self.timer.calcStpTime(self.stpTime)
		self.cal.clear_marks()
		self.cal.select_month(self.stpTime[1]-1, self.stpTime[0])
		self.cal.select_day(self.stpTime[2])
		self.cal.mark_day(self.stpTime[2])
		
	def CalDayClick(self, widget): 
		self.cal.clear_marks()
		self.stpTime = list(self.cal.get_date())
		self.stpTime[1] = self.stpTime[1]+1 

	def StartLogging(self, widget):
		data_pointer = []
		self.timer.setTime(self.conf_file, self.stpTime)
		with open (self.conf_file,"r+w") as starthhg:
			starthhg.seek(497,0)  
			starthhg.write(chr(0xFF))
			starthhg.write(chr(0x0F))
			starthhg.seek(502,0)  
			starthhg.write(chr(224))	# 32 bit!	--> 4320
			starthhg.write(chr(16))		# 32 bit!
			starthhg.write(chr(0))		# 32 bit!
			starthhg.write(chr(0))		# 32 bit!
			starthhg.seek(507,0)
			starthhg.write(chr(0))  
			starthhg.seek(1023,0)
			starthhg.write("l")
			starthhg.close()	
		hhgDir = re.sub("config.URE","",self.conf_file,count=1)
		subprocess.call(["sync"])
		print "HedgeHog has started and will stop on " + str(self.stpTime)
		dlg = gtk.Dialog("HedgeHog has started", None, 0, None)
		dlg.add_button(gtk.STOCK_OK, gtk.RESPONSE_OK)
		dlg.set_default_response(gtk.RESPONSE_OK)
		#dlg.connect("response",close)
		infotxt = gtk.Label()
		infotxt.set_text('Please disconnect HedgeHog')
		dlg.vbox.add(infotxt)
		dlg.set_size_request(250, 100)
		dlg.show_all()
		dlg.run()
		dlg.destroy()
		#subprocess.call(["umount", hhgDir])
		sys.exit(0)  

	def Quit(self, widget):
		sys.exit(0)

if len(sys.argv) >= 2:
	config_file = sys.argv[1]
else:	
	config_file = hgd.Hhg_scan_dlg().run() + '/config.URE'
		
if path.isfile(config_file) and access(config_file, W_OK):
	dialog = start_HHG_dialog()
	gtk.main()
	sys.exit(0)
else:
	sys.stderr.write("Error: Can't write to configuration file.")


sys.exit(1)


