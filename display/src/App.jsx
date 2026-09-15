import { use, useState } from 'react'
import './App.css'
import postsData from '../posts.json'

const PostPanel = ({item}) => {
    return (
      <div className = 'post-Panel'>
        <strong>{item.title}</strong>

        <div className="post-Field">
          <span>Level </span>: {item.jobLevel},
        </div>

        <div className="post-Field">
          <span>Graduate Friendly </span>: {item.gradTarget},
        </div>

        <div className="post-Field">
          <span>Require Commercial Experience</span>: {String(item.requireCommercialExperience)},
        </div>

        <div className="post-Field">
          <span>url</span>: 
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="job-url"
          >
            {item.url}
          </a>
        </div>
      </div>
    )
  };

function App() {
  const [selectedLevels,setSelectedLevels] = useState([])
  const [selectedTargets,setSelectedTargets] = useState([])
  //const [isLoading,setloading] = useState(true)

  const levels = ["entry", "junior", "mid", "senior", "NA"];
  const gradTarget = ["Targetted", "Can apply", "Not targetted", "NA"];

  `if (isLoading) {
    return (
      <div className="loading-screen">
        <h2>Scraping latest job listings...</h2>
        <p>Please wait, this may take a moment.</p>
      </div>
    );
  }`

  const handleLevelChange = (item,setState) => {
    setState((prev) => 
      prev.includes(item) 
        ? prev.filter((i) => i !== item) 
        : [...prev, item]
    );
  };
  const displayItems = postsData.filter((post) =>{
    const containsLevel = selectedLevels.length === 0 || selectedLevels.includes(post.jobLevel)
    const containsTarget = selectedTargets.length === 0 || selectedTargets.includes(post.gradTarget)
    return containsLevel & containsTarget;
  })
  
  return (
    <div className='container'>
      <h2> Filtered Scroll Box</h2>

      <div className='level-checkbox'>
        {levels.map(level => (
          <label key={level} className='cb-label'>
            <input
              type = "checkbox"
              checked = {selectedLevels.includes(level)}
              onChange={() => handleLevelChange(level,setSelectedLevels)}
            />
            {level}
          </label>
        ))}
      </div>
      <div className='target-checkbox'>
        {gradTarget.map(target => (
          <label key={target} className='cb-label'>
            <input
            type = "checkbox"
            checked = {selectedTargets.includes(target)}
            onChange={() => handleLevelChange(target,setSelectedTargets)}
            />
            {target}
          </label>
        ))}
      </div>
      <div className='display-panel'>
        <h2>Postings</h2>
          {displayItems.map((item,index) => (
            <PostPanel key={index} item={item}/>
          ))}   
      </div>
    </div>
  ); 
}

export default App
