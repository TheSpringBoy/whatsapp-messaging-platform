import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import axios from 'axios';

const GroupStatistics = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_SERVER_URL}/api/statistics/groups`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data);
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
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell align="right">שם קבוצה</TableCell>
            <TableCell align="right">הודעות שנשלחו</TableCell>
            <TableCell align="right">קריאות (%)</TableCell>
            <TableCell align="right">תגובות (%)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stats.map((group, index) => (
            <TableRow key={index}>
              <TableCell align="right" component="th" scope="row">
                {group.group_name}
              </TableCell>
              <TableCell align="right">{group.messages_sent}</TableCell>
              <TableCell align="right">{group.avg_read_percentage}%</TableCell>
              <TableCell align="right">{group.avg_reply_percentage}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default GroupStatistics;
