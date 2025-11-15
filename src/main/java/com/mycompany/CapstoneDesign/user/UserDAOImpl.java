package com.mycompany.CapstoneDesign.user;

import java.util.List;

import org.apache.ibatis.session.SqlSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class UserDAOImpl implements UserDAO {

	@Autowired
	private SqlSession sqlSession;
	// 1) MyBatis의 sqlSession으로 매퍼 xml의 SQL 실행

	private static final String namespace = "com.mycompany.CapstoneDesign.UserMapper"; //
	// 2) mapper XML의 namespace와 반드시 동일해야함 !

	@Override
	public int insertUser(UserVO user) {
		// 3) UserMapper.xml의 insertUser SQL 실행
		return sqlSession.insert(namespace + ".insertUser", user);
	}

	@Override
	public UserVO getUserByEmail(String email) {
		// 4) 이메일로 단일 유저 조회
		return sqlSession.selectOne(namespace + ".getUserByEmail", email);
	}

	@Override
	public UserVO getUserByID(String user_id) {
		// 5) user_id PK로 단일 유저 조회
		return sqlSession.selectOne(namespace + ".getUserById", user_id);
	}

	@Override
	public boolean existsEmail(String email) {
		int count = sqlSession.selectOne(namespace + "exixtsEmail", email);
		return count > 0;
	}

	@Override
	public List<UserVO> getUserList() {
		// 사용자 전체 조회 sql 호출
		return sqlSession.selectList(namespace + "getUserList");
	}

}
