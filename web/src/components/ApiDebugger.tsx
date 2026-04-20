import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ApiDebugger = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testEndpoint = async (endpoint: string, name: string) => {
    addResult(`🔍 Testing ${name} endpoint: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint);
      addResult(`📡 Status: ${response.status} ${response.statusText}`);
      addResult(`📡 Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
      
      if (response.ok) {
        const data = await response.json();
        addResult(`✅ ${name} Success: ${JSON.stringify(data).substring(0, 200)}...`);
      } else {
        const errorText = await response.text();
        addResult(`❌ ${name} Error: ${errorText}`);
      }
    } catch (error) {
      addResult(`💥 ${name} Network Error: ${error}`);
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    addResult('🚀 Starting API connectivity tests...');
    addResult(`🌐 Base URL: ${window.location.origin}`);
    
    // Test direct backend connection
    await testEndpoint('http://localhost:5000/api/certifications/', 'Direct Backend Certifications');
    await testEndpoint('http://localhost:5000/api/blogs/', 'Direct Backend Blogs');
    
    // Test through proxy
    await testEndpoint('/api/certifications/', 'Proxy Certifications');
    await testEndpoint('/api/blogs/', 'Proxy Blogs');
    
    addResult('🏁 All tests completed');
    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>🔧 API Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runAllTests} disabled={isLoading}>
            {isLoading ? '🔄 Testing...' : '🚀 Run API Tests'}
          </Button>
          <Button variant="outline" onClick={clearResults}>
            🧹 Clear Results
          </Button>
        </div>
        
        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <div className="text-gray-500">Click "Run API Tests" to start debugging...</div>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="mb-1">
                {result}
              </div>
            ))
          )}
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg text-sm">
          <h4 className="font-semibold mb-2">🔍 What this tests:</h4>
          <ul className="space-y-1">
            <li>• Direct connection to Flask backend (localhost:5000)</li>
            <li>• Proxy connection through development server</li>
            <li>• Network connectivity and CORS issues</li>
            <li>• Response status codes and error messages</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiDebugger;
