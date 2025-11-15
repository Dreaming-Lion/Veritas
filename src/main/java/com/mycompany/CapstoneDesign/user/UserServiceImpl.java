package com.mycompany.CapstoneDesign.user;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

	@Autowired
	private UserDAO userDAO; // [B]

	@Override
	public List<UserVO> getUserList() {
		return userDAO.getUserList(); // [1 -> DAO 연동]
	}

	@Override
	public UserVO getUserByID(String id) {
		return userDAO.getUserByID(id); // [2 -> DAO 연동]
	}

	@Override
	public void insertUser(UserVO user) {
		userDAO.insertUser(user); // [3 -> DAO 연동]
	}

	@Override
	public UserVO findByEmail(String email) {
		return userDAO.getUserByEmail(email);
	}
	
	
	@Override
	public boolean checkPassword(String id, String pw) {
		// DB에서 id로 사용자 조회 후 비밀번호화 비교
		UserVO user = userDAO.getUserByID(id);

		if (user == null) {
			return false;
		}			
		
		
		return user.getPassword().equals(pw);
	}

	@Override
	public boolean existsEmail(String email) {
		return userDAO.existsEmail(email);
	}

//	@Override
//	public void updateUser(UserVO user) {
//		userDAO.updateUser(user); // [4 -> DAO 연동]
//	}

//	@Override
//	public void deleteUser(String id) {
//		userDAO.deleteUser(id); // [5 -> DAO 연동]
//	}
	
	
//	@Override
//	public boolean existsNickname(String nickname) {
//		// TODO Auto-generated method stub
//		return false;
//	}

//	@Override
//	public String updateNickname(UserVO vo) {
//		// TODO Auto-generated method stub
//		return ""; // 고쳐야함..
//	}
}
