!macro customInstall
  DetailPrint "Register modsaber URI Handler"
  DeleteRegKey HKCR "modsaber"
  WriteRegStr HKCR "modsaber" "" "ModSaber Installer Protocol"
  WriteRegStr HKCR "modsaber" "URL Protocol" ""
  WriteRegBin HKCR "modsaber" "EditFlags" 00210000
  WriteRegStr HKCR "modsaber\DefaultIcon" "" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  WriteRegStr HKCR "modsaber\shell" "" ""
  WriteRegStr HKCR "modsaber\shell\open" "" ""
  WriteRegStr HKCR "modsaber\shell\Open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" %1'
!macroend

!macro customUnInstall
  DetailPrint "Remove modsaber URI Handler"
  DeleteRegKey HKCR "modsaber"
!macroend
