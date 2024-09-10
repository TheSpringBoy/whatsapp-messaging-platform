import React, { useState, memo } from 'react';
import axios from 'axios';
import {
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Box,
  CircularProgress,
  Snackbar,
  Paper,
  Avatar,
  Typography,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PreviewIcon from '@mui/icons-material/Preview';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import './MessageForm.css';

// Create RTL cache for flipping styles
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// RTL theme setup
const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Arial, sans-serif', // Use Hebrew-friendly fonts
  },
});

const serverUrl = process.env.REACT_APP_SERVER_URL;

const MessageForm = ({ token }) => {
  const [group, setGroup] = useState('0');
  const [whatsappNumber, setWhatsappNumber] = useState('1');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    // Create a preview URL for the media file
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setMediaPreviewUrl(url);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setSending(true);
    setSendStatus(null);

    const formData = new FormData();
    formData.append('index', whatsappNumber);
    formData.append('group', group);
    formData.append('message', message);

    if (file) {
      formData.append('media', file);
    }

    try {
      await axios.post(`${serverUrl}/api/messages/send-to-group`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setSending(false);
      setSendStatus('success');
    } catch (error) {
      setSending(false);
      setSendStatus('error');
    }
  };

  // Separate function for media preview
  const MediaPreview = memo(() => (
    file && (
      <Box>
        {file.type.startsWith('image/') && (
          <img src={mediaPreviewUrl} alt="Media Preview" style={{ maxWidth: '90%', marginBottom: '10px' }} />
        )}
        {file.type.startsWith('video/') && (
          <video controls style={{ maxWidth: '90%', marginBottom: '10px' }}>
            <source src={mediaPreviewUrl} type={file.type} />
          </video>
        )}
        {file && !file.type.startsWith('image/') && !file.type.startsWith('video/') && (
          <Typography variant="body2" color="textSecondary">
            {`הקובץ "${file.name}" ישלח`}
          </Typography>
        )}
      </Box>
    )
  ));

  // Text preview function (only affected by message updates)
  const TextPreview = () => (
    <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
      {message}
    </Typography>
  );

  const MessagePreview = () => (
    <Paper elevation={3} style={{ padding: '10px', margin: '20px 0', backgroundColor: '#DCF8C6' }}>
      <Box display="flex" alignItems="center">
        <Avatar style={{ marginLeft: '10px', backgroundColor: '#25D366' }}>
          <WhatsAppIcon />
        </Avatar>
        <Box>
          {/* Memoized Media Preview */}
          <MediaPreview />
          
          {/* Text Preview */}
          <TextPreview />
        </Box>
      </Box>
    </Paper>
  );

  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={theme}>
        <Box dir="rtl" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <form onSubmit={handleSendMessage} style={{ padding: '20px' }}>
            <h3>שלח הודעה או מדיה</h3>

            {/* WhatsApp Number Selection */}
            <FormControl fullWidth style={{ marginBottom: '20px' }}>
              <InputLabel>בחירת מספר WhatsApp</InputLabel>
              <Select label="בחירת מספר WhatsApp" onChange={(e) => setWhatsappNumber(e.target.value)} required>
                {Array.from({ length: 10 }, (_, i) => (
                  <MenuItem key={i + 1} value={(i + 1).toString()}>
                    {`WhatsApp מספר ${i + 1}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Group Selection */}
            <FormControl fullWidth style={{ marginBottom: '20px' }}>
              <InputLabel>בחירת קבוצה</InputLabel>
              <Select label="בחירת קבוצה" onChange={(e) => setGroup(e.target.value)} required>
                {[
              { value: '0', label: 'כל הקבוצות' },
              { value: '1', label: 'שלושים רבני עיר מן הערים הגדולות' },
              { value: '2', label: 'ארבעה עשר רבני עיר מן המועצות המקומיות הגדולות' },
              { value: '3', label: 'שני רבנים אזוריים מהמועצות האזוריות הגדולות' },
              { value: '4', label: 'שמונה רבנים מן היישובים הגדולים' },
              { value: '5', label: 'ארבעה רבני שכונות' },
              { value: '6', label: 'עשרה דיינים, הוותיקים ביותר' },
              { value: '7', label: 'הרב הצבאי הראשי והרב הצבאי' },
              { value: '8', label: 'עשרים וחמישה ראשי הערים הגדולות' },
              { value: '9', label: 'שישה ראשי המועצות המקומיות הגדולות' },
              { value: '10', label: 'ארבעה ראשי המועצות האזוריות הגדולות' },
              { value: '11', label: 'ארבעה עשר ראשי מועצות דתיות של הערים הגדולות' },
              { value: '12', label: 'ארבעה ראשי מועצות דתיות של המועצות המקומיות הגדולות' },
              { value: '13', label: 'שני שרים שבחרה הממשלה' },
              { value: '14', label: 'חמישה חברי הכנסת שבחרה ועדת הכנסת' },
              { value: '15', label: 'עשר נשות ציבור שמינה השר לשירותי הדת' },
              { value: '16', label: 'בדיקה' },
            ].map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Message Input */}
            <TextField
              label="הודעה"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ marginBottom: '20px' }}
              required={!file}
            />

            {/* Media Upload */}
            <Button
              variant="outlined"
              component="label"
              fullWidth
              style={{ marginBottom: '20px' }}
              endIcon={<CloudUploadIcon />}
            >
              העלה קובץ מדיה
              <input type="file" hidden onChange={handleFileChange} />
            </Button>

            {/* Display uploaded file name */}
            {file && (
              <Typography variant="body2" color="textSecondary">
                {file.name}
              </Typography>
            )}

            {/* Message Preview Toggle */}
            <Button
              variant="contained"
              color="primary"
              fullWidth
              style={{ marginBottom: '20px' }}
              onClick={() => setShowPreview(!showPreview)}
              endIcon={<PreviewIcon />}
            >
              הצג תצוגה מקדימה
            </Button>

            {/* WhatsApp-style Message Preview */}
            {showPreview && <MessagePreview />}

            {/* Send Button with Progress Indicator */}
            <Box position="relative" display="inline-flex" fullWidth style={{ width: '100%' }}>
              <Button
                type="submit"
                variant="contained"
                color="success"
                fullWidth
                disabled={sending}
                endIcon={<SendIcon />}
              >
                שלח
              </Button>
              {sending && (
                <CircularProgress
                  size={24}
                  style={{ position: 'absolute', top: '50%', left: '50%', marginTop: '-12px', marginLeft: '-12px' }}
                />
              )}
            </Box>

            {/* Status Indicator */}
            {sendStatus && (
              <Box mt={2} display="flex" justifyContent="center" alignItems="center">
                {sendStatus === 'success' ? (
                  <CheckCircleOutlineIcon color="success" fontSize="large" />
                ) : (
                  <ErrorOutlineIcon color="error" fontSize="large" />
                )}
              </Box>
            )}

            {/* Snackbar for feedback */}
            <Snackbar
              open={sendStatus === 'success'}
              message="ההודעה נשלחה בהצלחה!"
              autoHideDuration={3000}
              onClose={() => setSendStatus(null)}
            />
          </form>
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
};

export default MessageForm;
