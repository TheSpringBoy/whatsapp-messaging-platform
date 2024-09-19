import React, { useEffect, useState, memo } from 'react';
import { Bar } from 'react-chartjs-2';
import { CircularProgress, Typography, Paper, Box, Avatar } from '@mui/material';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

// WhatsApp-style message preview
const MessagePreview = ({ name, message, time }) => (
  <Paper
    elevation={3}
    style={{
      padding: '10px',
      margin: '20px 0',
      backgroundColor: '#DCF8C6',
      maxWidth: '80vw',
    }}
  >
    <Box display="flex" alignItems="center">
      <Avatar style={{ marginLeft: '10px', backgroundColor: '#25D366' }}>
        <WhatsAppIcon />
      </Avatar>
      <Box>
        <Typography variant="body2" color="textSecondary">
          {time}
        </Typography>
        {name && (
          <Typography variant="body2" color="textSecondary">
            {`הקובץ "${name}" נשלח עם ההודעה.`}
          </Typography>
        )}
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
        const response = await axios.get(
          `${process.env.REACT_APP_SERVER_URL}/api/statistics/per-message`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const groupedData = response.data.reduce((acc, current) => {
          const messageGroupId = current.message_group_id;

          if (!acc[messageGroupId]) {
            acc[messageGroupId] = {
              message_text: current.message_text,
              media_name: current.media_name,
              sent_at: current.sent_at,
              total_sent: 0,
              total_reads: 0,
              total_replies: 0,
              groups: [],
            };
          }

          acc[messageGroupId].total_sent += parseInt(current.total_sent, 10);
          acc[messageGroupId].total_reads += parseInt(current.total_reads, 10);
          acc[messageGroupId].total_replies += parseInt(current.total_replies, 10);

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
          const sortedGroups = messageStat.groups.sort(
            (a, b) => b.read_percentage - a.read_percentage
          );

          return (
            <div key={index} style={{ margin: '40px 0' }}>
              <MessagePreview
                name={messageStat.media_name}
                message={messageStat.message_text}
                time={messageStat.sent_at}
                style={{
                  maxWidth: '100%',
                  padding: '10px',
                  boxSizing: 'border-box',
                }}
              />
              <Typography variant="body2" color="textSecondary">
                {`סה"כ הודעות שנשלחו: ${messageStat.total_sent}, סה"כ קריאות: ${messageStat.total_reads}, סה"כ תשובות: ${messageStat.total_replies}`}
              </Typography>

              {/* Wrap the charts in a flex container */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  overflowX: 'auto',
                }}
              >
                {sortedGroups.map((group, i) => {
                  if (
                    group.read_percentage === '0' &&
                    group.reply_percentage === '0'
                  ) {
                    return (
                      <Typography
                        key={i}
                        variant="body2"
                        style={{
                          margin: '10px 0',
                          flex: '0 0 auto',
                          width: '50%',
                          boxSizing: 'border-box',
                          padding: '10px',
                          minWidth: '300px',
                        }}
                      >
                        {`אין פעילות בקבוצה: ${group.group_name}`}
                      </Typography>
                    );
                  }

                  const data = {
                    labels: ['קריאות', 'תשובות'], // X-axis labels
                    datasets: [
                      {
                        label: group.group_name, // Group name displayed here
                        data: [group.read_percentage, group.reply_percentage],
                        backgroundColor: [
                          'rgba(75, 192, 192, 0.6)',
                          'rgba(255, 99, 132, 0.6)',
                        ],
                        borderColor: [
                          'rgba(75, 192, 192, 1)',
                          'rgba(255, 99, 132, 1)',
                        ],
                        borderWidth: 1,
                      },
                    ],
                  };

                  const options = {
                    indexAxis: 'y', // Horizontal bars
                    responsive: true,
                    maintainAspectRatio: false, // Allow flexible resizing
                    plugins: {
                      legend: { display: false },
                      title: {
                        display: true,
                        text: `${group.group_name}`, // Display group name as chart title
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                              label += ': ';
                            }
                            label += context.raw + '%';
                            return label;
                          },
                        },
                      },
                    },
                    scales: {
                      x: {
                        max: 100, // Ensure the graph goes up to 100%
                        ticks: {
                          callback: function (value) {
                            return value + '%'; // Display values as percentages
                          },
                          font: { size: 14 },
                          color: '#1D3557',
                        },
                      },
                      y: {
                        ticks: {
                          font: { size: 14 },
                          color: '#1D3557',
                        },
                      },
                    },
                  };

                  return (
                    <div
                      key={i}
                      style={{
                        flex: '0 0 auto',
                        width: '50%', // Each chart takes up 50% of the container
                        boxSizing: 'border-box',
                        padding: '10px',
                        minWidth: '300px', // Prevents the chart from becoming too narrow
                      }}
                    >
                      <div style={{ minHeight: '100px' }}>
                        <Bar data={data} options={options} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default MessageStatistics;
