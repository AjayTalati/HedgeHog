/*******************************************************************************
 FileName:     	display_config.c
 Dependencies:
 Processor:	PIC18F46J50
 Hardware:	Porcupine HedgeHog OLED or TESTBED
 Compiler:  	Microchip C18
 Author:        KristofVL
 ******************************************************************************/

#include "display_config.h"


/******************************************************************************/
void up_dispcycle(void) {
    if((++disp_cycle)>MAX_DISPCYCLE) 
        disp_cycle=0; 
}

void disp_init(void) {
    BYTE i;
    for (i = 0; i < DISP_PLOTWINSIZE; i++) {
        abuf[i].x = abuf[i].y = abuf[i].z = lbuf[i] = 0;
    }
    disp_cmd = DISP_CMD_INTRO; // Initialze to intro screen
}

void disp_acc_init(void) {
    oled_reset();
    _oledi(porcpic, PORCPIC_X, 8, 75);
    _oledw("Motion Data",0,3);
}

void disp_time_init(void) {
    oled_reset();
    disp_cmd = 0;
}

void disp_env_init(void) {
    oled_reset();
    _oledi(porcpic, PORCPIC_X, 8, 75);
    _oledw("Ambient Data",0,3);  _oledw("light:",2,7);
    _oledw("thermo:",7,7);  _oledw("`C",7,64);
}

void disp_USB_init(void) {
    oled_reset();
    _oledw("connected",3,9); _oledw("to USB",4,19);
    disp_cmd=0;
}

void disp_init_intro(rom char* n, rom char* v) {
    oled_reset();
    _oledw(n,0,9); _oledw(v,1,15);
    _oledi(porcpic, PORCPIC_X, 8, 75);
    disp_cmd=0;
}

void disp_acc_update(PACC_XYZ accval, char* acc_str) {
    BYTE i;
    oled_put_str(acc_str, 1, 0);
    oled_clearRect(0xB2, 0xB8, OLED_OFFSET, DISP_PLOTWINSIZE);
    // scroll abuf 1 to the left:
    memmove((void*)abuf, (void*)(abuf+1), (DISP_PLOTWINSIZE-1)*sizeof(ACC_XYZ));
    abuf[DISP_PLOTWINSIZE - 1].x = (accval->x)>>3;
    abuf[DISP_PLOTWINSIZE - 1].y = (accval->y)>>3;
    abuf[DISP_PLOTWINSIZE - 1].z = (accval->z)>>3;
    for (i = 1; i < DISP_PLOTWINSIZE; i++) {
        oled_drawVLine(abuf[i].x, abuf[i - 1].x, i, 44);
        oled_drawVLine(abuf[i].y, abuf[i - 1].y, i, 56);
        oled_drawVLine(abuf[i].z, abuf[i - 1].z, i, 72);
    }
    disp_cmd=0;
}

void disp_env_update(BYTE lgt_val, char* lt_str, char* tmp_str)
{
    BYTE i;
    oled_put_str(lt_str, 2, 49);
    oled_put_str(tmp_str, 7, 49);
    oled_clearRect(0xB3, 0xB7, OLED_OFFSET + 6, DISP_PLOTWINSIZE);
    // scroll lbuf 1 to the left:
    memmove((void*)lbuf, (void*)(lbuf + 1),
              (DISP_PLOTWINSIZE-1)*sizeof(UINT8));
    lbuf[DISP_PLOTWINSIZE - 1] = lgt_val;
    for (i = 1; i < DISP_PLOTWINSIZE; i++) {
        oled_drawVLine(lbuf[i], lbuf[i - 1], i + 6, 54);
    }
    disp_cmd=0;
}

void disp_time_update( char* dstr,  char* tstr) {
    _oleds(dstr, 7, 2); _oleds(tstr, 7, 79); // print time & date at bottom
    _oledi(bmp[tstr[0]-48], PORCWF_X, 5, 0);
    _oledi(bmp[tstr[1]-48], PORCWF_X, 5, 30);
    _oledi(bmp[tstr[3]-48], PORCWF_X, 5, 70);
    _oledi(bmp[tstr[4]-48], PORCWF_X, 5, 100);
    _oledw("o", 2, 62); _oledw("o", 4, 62);
    disp_cmd=0;
}

BYTE disp_update_time(void) {
    if ((disp_mode == DISP_MODE_TIME)&&(disp_cycle == 200)) {
        disp_cmd = DISP_CMD_CLOCK; // update clock!
        disp_cycle = 0;
        return 1;
    }
    else return 0;
}

BYTE disp_update_env(void){
    if ((disp_mode == DISP_MODE_LGHT)&&(disp_cycle == 8800)) {
        disp_cmd = DISP_CMD_LGTMP;
        disp_cycle = 0;
        return 1;
    }
    else return 0;
}

BYTE disp_update_accl(void){
    if ((disp_mode == DISP_MODE_ACCL)&&(disp_cycle == 2800)) {
        disp_cmd = DISP_CMD_ACCUP;
        disp_cycle = 0;
        return 1;
    }
    else return 0;
}

BYTE disp_update_init(void){
    if ((disp_mode == DISP_MODE_INIT)&&(disp_cycle ==  MAX_DISPCYCLE)) {
        disp_mode = DISP_MODE_ACCL;
        return 1;
    }
    else return 0;
}

BYTE disp_update_log_time(void) {
    if ((disp_cycle > DISP_CYCLE_1STICKS) && (disp_mode == DISP_MODE_TIME)) {
        disp_cmd = DISP_CMD_CLOCK;
        disp_cycle = 0;
        return 1;
    }
    else return 0;
}

// toggle between ACCL, LGHT, and TIME modi:
void disp_user_conf_toggle(void) {
    if (disp_mode >= DISP_MODE_ACCL) {
        if (disp_mode==DISP_MODE_TIME)
            disp_mode=DISP_MODE_ACCL;
        else disp_mode++;
        switch (disp_mode) {
            case DISP_MODE_LGHT: disp_env_init(); break;
            case DISP_MODE_TIME: disp_time_init(); break;
            case DISP_MODE_ACCL: disp_acc_init(); break;
        }
    }
}

void disp_user_log_toggle(void) {
    if (disp_mode == DISP_MODE_TIME) { 
        disp_mode = DISP_MODE_LOGG;
        disp_cmd = DISP_CMD_LOGNG;
    }
    else {  disp_mode = DISP_MODE_TIME;
            disp_time_init();
            disp_cycle = DISP_CYCLE_1STICKS+1; // refresh soon..
    }
}

DISP_CMD disp_refresh(void) {
    switch (disp_cmd) {
        case DISP_CMD_IUSBC: disp_USB_init(); break;
        case DISP_CMD_ERRLG:
            oled_put_ROMstr((rom char*) "SD write error", 3, 17); disp_cmd=0;
            break;
        case DISP_CMD_LOGNG:
            oled_cmd(OLEDREG_DISPLAY_OFF); disp_cmd=0;
            break;
    }
    return disp_cmd;
}

void disp_start_log(void) {
    disp_mode = DISP_MODE_LOGG;
    disp_cmd = DISP_CMD_LOGNG;
}
void disp_start_usb(void) {
    disp_mode = DISP_MODE_USBC;
    disp_cmd = DISP_CMD_IUSBC;
}

void disp_log_subdue(void) {
    if (disp_mode == DISP_MODE_TIME)
        oled_cmd(OLEDREG_DISPLAY_OFF);
}

void disp_log_revive(void) {
    if (disp_mode == DISP_MODE_TIME)
        oled_cmd(OLEDREG_DISPLAY_ON);
}

rom unsigned char porcpic[408] = {
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 224, 0, 0, 0, 192, 62, 68, 128, 64, 32, 24, 4, 226, 31, 0, 128, 64, 32, 144, 120, 128, 128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 56, 208, 160, 158, 129, 131, 140, 134, 129, 128, 128, 128, 128, 64, 64, 64, 65, 67, 65, 64, 64, 64, 67, 65, 77, 83, 32, 32, 224, 224, 16, 16, 16, 16, 160, 64, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 64, 48, 24, 4, 255, 0, 0, 28, 60, 190, 158, 204, 64, 64, 96, 32, 160, 144, 80, 80, 24, 8, 8, 12, 4, 4, 4, 2, 66, 118, 79, 69, 224, 65, 2, 1, 1, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 64, 99, 82, 202, 6, 0, 0, 251, 38, 55, 23, 157, 84, 44, 4, 0, 0, 3, 3, 2, 3, 130, 130, 194, 96, 0, 0, 0, 0, 4, 12, 36, 36, 37, 39, 228, 36, 4, 196, 100, 28, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 48, 121, 126, 60, 156, 92, 53, 18, 18, 9, 8, 8, 4, 4, 134, 130, 130, 131, 195, 195, 197, 230, 227, 48, 48, 16, 144, 152, 200, 72, 120, 56, 254, 189, 12, 6, 1, 2, 54, 212, 140, 8,
 128, 128, 128, 192, 96, 32, 32, 240, 120, 60, 28, 10, 5, 4, 130, 114, 31, 1, 193, 97, 65, 65, 65, 65, 64, 64, 32, 36, 227, 0, 0, 3, 128, 96, 16, 76, 127, 237, 116, 48, 8, 134, 195, 64, 64, 120, 100, 4, 4, 7, 4,
 1, 2, 7, 3, 15, 7, 1, 0, 0, 0, 128, 64, 48, 14, 3, 192, 48, 30, 9, 4, 12, 24, 4, 6, 24, 16, 124, 71, 64, 128, 128, 135, 136, 136, 152, 208, 244, 228, 226, 195, 130, 135, 0, 0, 0, 0, 0, 0, 0, 0, 0,
 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 13, 8, 8, 152, 217, 217, 251, 254, 222, 238, 124, 124, 120, 88, 104, 56, 0, 0, 0, 0, 0, 0, 96, 112, 120, 120, 125, 63, 63, 30, 12, 13, 9, 15, 6, 0, 0, 0, 0, 0, 0,
};

rom unsigned char bmp[10][140] =
{
    { 0,0,192,240,248,252,252,254,254,255,255,255,127,127,127,127,255,255,255,255,254,254,252,248,240,224,128,0,248,255,255,255,255,255,255,255,127,3,0,0,0,0,0,0,0,1,7,255,255,255,255,255,255,255,255,248,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,63,255,255,255,255,255,255,255,252,128,0,0,0,0,0,0,0,0,192,255,255,255,255,255,255,255,255,15,0,3,15,31,63,127,127,255,255,255,255,254,252,252,252,254,254,255,255,255,127,127,63,31,15,3,0,0 },
    { 0,0,128,192,224,224,240,248,248,252,254,254,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,15,31,15,15,7,7,3,3,1,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,48,254,254,254,254,254,254,254,254,255,255,255,255,255,255,255,255,254,254,254,254,254,254,254,252,0 },
    { 0,240,248,252,252,254,254,254,255,255,255,255,255,255,255,255,255,255,255,254,254,252,252,248,224,0,0,0,0,3,7,3,3,1,1,0,0,0,0,0,0,0,1,199,255,255,255,255,255,255,255,255,255,63,0,0,0,0,0,0,0,0,0,0,0,128,192,224,240,252,254,255,255,255,255,255,127,63,31,7,1,0,0,0,0,0,128,192,224,240,248,252,254,255,255,255,255,127,63,31,15,7,3,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,254,254,254,254,254,254,254,254,254,254,254,254,254,254,254,16},
    { 0,240,248,252,252,254,254,254,127,127,127,127,127,127,255,255,255,255,255,254,254,252,248,240,224,0,0,0,0,1,3,3,1,1,0,0,0,0,0,0,0,0,128,225,255,255,255,255,255,255,255,255,127,0,0,0,0,0,0,0,126,126,126,126,126,126,127,127,255,255,255,255,255,255,255,255,255,243,241,224,192,128,0,0,0,128,128,0,0,0,0,0,0,0,0,0,0,0,0,1,131,255,255,255,255,255,255,255,255,255,254,0,0,63,127,127,255,254,254,254,254,252,252,252,252,254,254,255,255,255,255,255,127,127,63,31,15,7,1,0},
    { 0,0,0,0,0,0,0,0,0,0,192,240,252,254,254,255,255,255,255,255,255,255,255,254,254,0,0,0,0,0,0,0,0,128,224,248,254,255,255,255,255,63,31,7,3,255,255,255,255,255,255,255,255,0,0,0,0,192,240,252,255,255,255,255,127,31,15,3,0,0,0,0,0,255,255,255,255,255,255,255,255,0,0,0,127,255,255,255,255,255,255,255,254,254,254,254,254,254,254,254,254,255,255,255,255,255,255,255,255,254,254,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,0,0,0},
    { 0,0,252,254,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,254,60,0,0,0,0,0,255,255,255,255,255,255,255,255,128,128,128,128,128,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,63,63,63,63,63,63,63,63,63,63,63,63,127,127,255,255,255,255,255,254,252,252,248,224,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,195,255,255,255,255,255,255,255,255,127,0,0,127,127,255,255,254,254,254,252,252,252,252,252,254,254,255,255,255,255,127,127,63,31,31,7,3,0,0},
    { 0,0,0,128,224,240,248,248,252,254,254,254,255,255,127,127,127,127,127,127,127,127,255,254,254,0,0,0,0,240,254,255,255,255,255,255,255,31,3,1,128,128,128,128,128,128,128,128,128,0,0,0,0,0,0,0,240,255,255,255,255,255,255,255,255,127,127,63,63,63,63,63,63,63,127,255,255,255,255,255,254,252,240,192,0,255,255,255,255,255,255,255,255,224,0,0,0,0,0,0,0,0,128,255,255,255,255,255,255,255,255,127,0,0,7,15,63,63,127,255,255,255,255,254,252,252,252,252,254,254,255,255,255,127,63,63,31,15,3,0},
    { 124,254,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,224,248,255,255,255,255,255,255,255,63,7,1,0,0,0,0,0,0,0,0,0,0,0,0,192,248,254,255,255,255,255,255,255,127,31,3,0,0,0,0,0,0,0,0,0,0,0,0,192,240,252,255,255,255,255,255,255,255,63,15,1,0,0,0,0,0,0,0,0,0,0,0,0,224,248,254,255,255,255,255,255,255,127,31,7,0,0,0,0,0,0,0,0,0,0,0,0},
    { 0,192,224,248,252,252,254,254,255,255,127,127,63,63,63,127,127,255,255,255,254,254,254,252,248,240,128,0,0,63,255,255,255,255,255,255,255,241,224,192,128,128,0,128,192,224,255,255,255,255,255,255,255,127,15,0,0,0,128,193,195,231,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,247,243,225,192,128,0,0,252,255,255,255,255,255,255,255,143,7,3,1,0,0,0,1,1,3,7,255,255,255,255,255,255,255,255,252,7,15,63,63,127,255,255,255,255,254,254,252,252,252,252,252,252,254,255,255,255,127,127,63,63,31,7,1},
    { 0,192,224,248,248,252,254,254,255,255,255,127,127,127,127,127,255,255,255,254,254,252,252,248,224,192,0,0,254,255,255,255,255,255,255,255,135,1,0,0,0,0,0,0,0,1,15,255,255,255,255,255,255,255,254,0,7,31,127,127,255,255,255,255,255,254,252,248,248,248,248,248,252,252,254,255,255,255,255,255,255,255,255,0,0,0,0,0,0,1,1,1,3,3,3,3,3,3,3,1,129,193,248,255,255,255,255,255,255,127,15,0,0,62,126,254,254,254,254,252,252,252,252,252,252,254,254,255,255,255,127,63,63,31,15,7,1,0,0,0}
};
