import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

// 아이콘 컴포넌트
const Icons = {
  Home: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Plus: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Profile: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

export default function ProfileEditPage() {
  const navigate = useNavigate();
  
  const [nickname, setNickname] = useState('소근소근');
  const [profileImage, setProfileImage] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    console.log('수정 제출:', { nickname, profileImage });
    alert('프로필이 수정되었습니다!');
    navigate('/profile'); // 수정 후 프로필 화면으로 이동
  };

  return (
    // 배경은 GPS 화면과 통일감을 주기 위해 gps-container 클래스 사용
    <div className="gps-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* 헤더 타이틀 */}
      <h1 className="auth-title" style={{ marginTop: '3rem', marginBottom: '2rem' }}>
        프로필 수정
      </h1>

      <div className="auth-form" style={{ width: '100%', maxWidth: '320px', gap: '24px' }}>
        
        {/* 프로필 사진 섹션 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginLeft: '4px' }}>
            프로필 사진
          </label>
          {/* 커스텀 디자인을 위해 auth-input 클래스 활용 */}
          <div className="auth-input" style={{ display: 'flex', alignItems: 'center', padding: '10px' }}>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageChange}
              style={{ color: 'white', fontSize: '12px', width: '100%' }}
            />
          </div>
        </div>

        {/* 별명 섹션 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginLeft: '4px' }}>
            별명
          </label>
          <input 
            className="auth-input"
            type="text" 
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="별명을 입력하세요"
          />
        </div>

        {/* 수정하기 버튼 */}
        <button className="auth-button" onClick={handleSubmit} style={{ marginTop: '1rem' }}>
          완료
        </button>
      </div>

      {/* 👇 하단 내비게이션 바 (GPS.tsx와 구조 통일) */}
      <div className="bottom-nav">
        {/* 1. 홈 버튼 (클릭 시 GPS 화면으로 이동) */}
        <div className="nav-item" onClick={() => navigate('/gps')}>
          <Icons.Home />
          <span className="nav-text">홈</span>
        </div>

        {/* 2. 플러스 버튼 */}
        <div className="nav-plus-wrapper">
            <button className="nav-plus-btn" onClick={() => navigate('/search')}>
                <Icons.Plus />
            </button>
        </div>

        {/* 3. 내 정보 버튼 (현재 페이지 활성화 표시 active 클래스 추가) */}
        <div 
          className="nav-item active" 
          onClick={() => navigate('/profile')}
        >
          <Icons.Profile />
          <span className="nav-text">나</span>
        </div>
      </div>
    </div>
  );
}