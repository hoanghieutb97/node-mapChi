#include "waitCursorDone.au3"

; Kích ho?t c?a s? Wilcom
Local $list = WinList()
For $i = 1 To $list[0][0]
    Local $title = $list[$i][0]
    If StringInStr($title, "Ultimate Special Edition") > 0 Or StringInStr($title, "Tajima") > 0 Then
        WinActivate($title)
        WinWaitActive($title)
        ExitLoop
    EndIf
Next

Sleep(500)
;dong cac file cu
Send("!f")
Sleep(200)
Send("l")
Sleep(200)
Send("!n")
WaitCursorDone()

; mo file theu
Send("!f")
Sleep(200)
Send("o")
Sleep(200)
Send(@DesktopDir & "\serverEMB\fileEMB\file.emb{ENTER}")
WaitCursorDone()

; click chuot trai xoa chi thua
MouseClick("left", 1170, 978)
WaitCursorDone()

; Xuat file DST
Send("+e") ; Shift + E
WaitCursorDone()
Send(@DesktopDir & "\serverEMB\fileEMB\file.dst")
WaitCursorDone()
Send("{ENTER}") 
WaitCursorDone()


;yes khi luu De	
If WinExists("Confirm Save As") Then
    WinActivate("Confirm Save As")
    WaitCursorDone()
	 Send("!y") ; Alt + Y
    
EndIf
 WaitCursorDone()
 
 ;click print preview
Send("!f")     
Sleep(200)
Send("v")
Sleep(200)
Send("{ENTER}") 
WaitCursorDone()
Sleep(1000)
; luu pdf
; click save as pdf
MouseClick("left", 128, 36)
Sleep(200)
WaitCursorDone()
Send(@DesktopDir & "\serverEMB\fileEMB\file.pdf")
WaitCursorDone()
Send("!s") 
 WaitCursorDone()
;yes khi luu De	
If WinExists("Confirm Save As") Then
    WinActivate("Confirm Save As")
    WaitCursorDone()
	 Send("!y") ; Alt + Y
    
EndIf
 WaitCursorDone()
 
 
 ; doi den khi co fiel sdt va pdf thi  moi ghi De
 Local $folder = @DesktopDir & "\serverEMB\fileEMB"
Local $file1 = $folder & "\file.dst"
Local $file2 = $folder & "\file.pdf"
Local $timeout = 60 ; giây
Local $timer = TimerInit()
While 1
    If FileExists($file1) And FileExists($file2) Then
        ; luu file txt thông báo
		Local $f = FileOpen(@DesktopDir & "\serverEMB\status.txt", 2)
		FileWrite($f, "done")
		FileClose($f)

        Exit
    EndIf

    If TimerDiff($timer) > $timeout * 1000 Then
        Exit ; h?t gi? thì thoát
    EndIf

    Sleep(500)
WEnd


