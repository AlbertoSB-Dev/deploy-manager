'use client';

import { useState, useEffect } from 'react';
import { GitBranch, Clock, Globe, Server, Play, Square, RefreshCw, Trash2, FileText, Terminal as TerminalIcon, Edit, Rocket, History } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
