; ============================
; Hàm d?i con tr? chu?t h?t "loading"
; ============================
Func WaitCursorDone()
    Local $cur
    Do
        $cur = MouseGetCursor()
        Sleep(100)
    Until $cur <> 3 And $cur <> 11
EndFunc
