import React, { useEffect, useState, memo } from 'react';
import { Bar } from 'react-chartjs-2';
import { CircularProgress, Typography, Paper, Box, Avatar } from '@mui/material';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// WhatsApp-style message preview
const MessagePreview = ({ name, message }) => (
  <Paper elevation={3} style={{ padding: '10px', margin: '20px 0', backgroundColor: '#DCF8C6' }}>
    <Box display="flex" alignItems="center">
      <Avatar style={{ marginLeft: '10px', backgroundColor: '#25D366' }}>
        <WhatsAppIcon />
      </Avatar>
      <Box>
        { name && <Typography variant="body2" color="textSecondary">
            {`הקובץ "${name}" נשלח עם ההודעה.`}
        </Typography>}
        <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
          {message}
        </Typography>
      </Box>
    </Box>
  </Paper>
);

const MessageStatistics = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [messagesStats, setMessagesStats] = useState([]);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api/statistics/per-message`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Grouping by message_group_id
        const groupedData = response.data.reduce((acc, current) => {
          const messageGroupId = current.message_group_id;
          if (!acc[messageGroupId]) {
            acc[messageGroupId] = {
              message_text: current.message_text,
              media_name: current.media_name,
              groups: [],
            };
          }
          acc[messageGroupId].groups.push({
            group_name: current.group_name,
            read_percentage: parseFloat(current.read_percentage).toFixed(0),
            reply_percentage: parseFloat(current.reply_percentage).toFixed(0),
          });
          return acc;
        }, {});

        setMessagesStats(Object.values(groupedData));
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [token]);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <div>
      {messagesStats.length === 0 ? (
        <Typography variant="h6">אין נתונים זמינים</Typography>
      ) : (
        messagesStats.map((messageStat, index) => {
          // Data for chart
          const data = {
            labels: messageStat.groups.map((group) => 
              group.group_name
            ),
            datasets: [
              {
                label: 'קריאות (%)',
                data: messageStat.groups.map((group) => group.read_percentage),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
              },
              {
                label: 'תשובות (%)',
                data: messageStat.groups.map((group) => group.reply_percentage),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
              },
            ],
          };

          const options = {
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: `סטטיסטיקות לפי קבוצות:` },
            },
            scales: {
              x: {
                ticks: {
                  font: {
                    size: 14, // Increase text size
                  },
                  color: '#1D3557', // Vibrant dark blue color
                  callback: function(value, index, values) {
                    const label = this.getLabelForValue(value);
                    // Split the label into an array of words
                    const words = label.split(' ');
                    // Limit the number of characters per line
                    let lineLength = 20;
                    // Join words into chunks that are not longer than the line length
                    let lines = [];
                    let currentLine = [];
                    words.forEach((word) => {
                      const potentialLine = [...currentLine, word].join(' ');
                      if (potentialLine.length > lineLength) {
                        lines.push(currentLine.join(' '));
                        currentLine = [word];
                      } else {
                        currentLine.push(word);
                      }
                    });
                    lines.push(currentLine.join(' '));
                    return lines; // Return the array of lines to be displayed on multiple lines
                  },
                },
              },
              y: {
                ticks: {
                  font: {
                    size: 14, // Same font size for Y-axis
                  },
                  color: '#1D3557', // Same vibrant color for Y-axis
                },
              },
            },
          };
                  

          return (
            <div key={index} style={{ margin: '40px 0', minWidth: '600px' }}>
              <MessagePreview name={messageStat.media_name} message={messageStat.message_text} />
              <Bar data={data} options={options} style={{maxHeight: '250px'}}/>
            </div>
          );
        })
      )}
    </div>
  );
};

export default MessageStatistics;
