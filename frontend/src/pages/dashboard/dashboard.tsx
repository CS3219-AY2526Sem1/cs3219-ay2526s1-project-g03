import './dashboard.css';
import PracticeSessionForm from '../../features/matching/practiceSessionForm/practiceSessionForm'
import LogoNavbar from '../../components/logoNavbar/logoNavbar'

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <LogoNavbar/>
      <div className="dashboard-header">
        <h1> Ready to Practice?</h1>
        <p> Find a coding partner and solve problem together. Choose your difficulty,
          topic, and language preferences to get started.</p>
      </div>
      <PracticeSessionForm />
    </div>
  )
}


export default Dashboard;

