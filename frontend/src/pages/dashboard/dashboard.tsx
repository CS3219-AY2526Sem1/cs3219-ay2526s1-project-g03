import styles from './dashboard.module.css';
import ProgressCard from '../../features/progress/progressCard';
import PracticeSessionForm from '../../features/matching/practiceSessionForm/practiceSessionForm'

const Dashboard = () => {
  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <h1> Ready to Practice?</h1>
        <p> Find a coding partner and solve problem together. Choose your difficulty,
          topic, and language preferences to get started.</p>
      </div>
      <ProgressCard />
      <PracticeSessionForm />
    </div>
  )
}


export default Dashboard;

