import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', Ajay: 400, Selvaa: 240 },
  { name: 'Tue', Ajay: 300, Selvaa: 398 },
  { name: 'Wed', Ajay: 200, Selvaa: 400 },
  { name: 'Thu', Ajay: 278, Selvaa: 308 },
  { name: 'Fri', Ajay: 189, Selvaa: 480 },
  { name: 'Sat', Ajay: 239, Selvaa: 380 },
  { name: 'Sun', Ajay: 349, Selvaa: 430 },
];

export function AnalyticsChart() {
  return (
    <div className="glass-panel p-6 h-[300px]">
      <h3 className="font-display font-bold text-xl mb-4">Weekly Points</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            cursor={{fill: '#ffffff10'}} 
            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }} 
          />
          <Bar dataKey="Ajay" fill="#81ecff" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Selvaa" fill="#e966ff" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
